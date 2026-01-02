import { useEffect, useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AuthContext } from "@/context/auth-context";
import {
    createArticleService,
    fetchArticlesService,
    toggleWithMeService,
    updateArticleService,
    reportArticleService
} from "@/services";
import { MoreVertical, Search, Hand, MessageCircleWarning, AlertTriangle, EyeOff, LogIn } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useNavigate } from "react-router-dom"; // Import useNavigate

const filters = [
    { id: "latest", label: "Latest" },
    { id: "my_articles", label: "My Articles" },
    { id: "most_with_me", label: "Most With Me" },
    { id: "banking", label: "Banking Scam" },
    { id: "fraud", label: "Online Fraud" },
    { id: "call_scam", label: "Call Scam" },
];

const reportReasons = [
    "Spam / Irrelevant",
    "False Information",
    "Harassment / Hate Speech",
    "Scam / Phishing Link",
    "Other"
];

function ArticlePage() {
    const { auth } = useContext(AuthContext);

    const navigate = useNavigate(); // Hook for redirection

    const [articles, setArticles] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilters, setSelectedFilters] = useState(["latest"]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReadMoreOpen, setIsReadMoreOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [currentArticle, setCurrentArticle] = useState(null);
    const [reportReason, setReportReason] = useState("Spam / Irrelevant");

    const [formData, setFormData] = useState({ title: "", content: "", category: "" });

    async function fetchArticles() {
        let queryParams = new URLSearchParams();
        if (searchQuery) queryParams.append("search", searchQuery);

        // Only send userId if logged in (for "My Articles" filter)
        if (auth?.authenticate && auth?.user?._id) {
            queryParams.append("userId", auth.user._id);
        }

        const activeLabels = filters
            .filter(f => selectedFilters.includes(f.id))
            .map(f => f.label)
            .join(",");

        if (activeLabels) queryParams.append("category", activeLabels);

        const response = await fetchArticlesService(`?${queryParams.toString()}`);
        if (response?.success) setArticles(response.data);
    }

    useEffect(() => {
        fetchArticles();
    }, [searchQuery, selectedFilters, auth?.user]);

    // --- AUTH CHECK HELPER ---
    function handleAuthAction(actionCallback) {
        if (!auth?.authenticate) {
            toast({
                title: "Authentication Required",
                description: "Please login to perform this action.",
                variant: "destructive",
            });
            navigate("/auth"); // Redirect to login page
            return;
        }
        actionCallback();
    }

    async function handleSaveArticle() {
        // Double check auth here just in case
        if (!auth?.user) return;

        const payload = {
            ...formData,
            authorId: auth?.user?._id,
            authorName: auth?.user?.userName,
        };

        if (currentArticle?._id) {
            await updateArticleService(currentArticle._id, payload);
        } else {
            await createArticleService(payload);
        }

        setIsModalOpen(false);
        setFormData({ title: "", content: "", category: "" });
        setCurrentArticle(null);
        fetchArticles();
    }

    function handleWithMe(articleId) {
        handleAuthAction(async () => {
            await toggleWithMeService(articleId, auth?.user?._id);
            fetchArticles();
        });
    }

    function handleOpenReport(article) {
        handleAuthAction(() => {
            setCurrentArticle(article);
            setReportReason("Spam / Irrelevant");
            setIsReportModalOpen(true);
        });
    }

    async function handleSubmitReport() {
        const response = await reportArticleService(currentArticle._id, auth?.user?._id, reportReason);
        if (response?.success) {
            toast({ title: "Report Sent", description: "Thanks for keeping the community safe." });
            setIsReportModalOpen(false);
            fetchArticles();
        }
    }

    function toggleFilter(filterId) {
        // Prevent unauthenticated users from seeing "My Articles"
        if (filterId === "my_articles" && !auth?.authenticate) {
            toast({ title: "Login Required", description: "Login to see your articles." });
            return;
        }

        if (["latest", "most_with_me", "my_articles"].includes(filterId)) {
            setSelectedFilters([filterId]);
            return;
        }
        setSelectedFilters(prev => {
            const cleaned = prev.filter(p => !["latest", "most_with_me", "my_articles"].includes(p));
            return prev.includes(filterId) ? cleaned.filter(id => id !== filterId) : [...cleaned, filterId];
        });
    }

    return (
        <div className="container mx-auto p-6 space-y-6">

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search scams, keywords..."
                        className="pl-10 rounded-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {/* CREATE BUTTON - Protected */}
                <Button
                    onClick={() => handleAuthAction(() => {
                        setCurrentArticle(null);
                        setFormData({ title: "", content: "", category: "" });
                        setIsModalOpen(true);
                    })}
                    className="rounded-full bg-red-600 hover:bg-red-700"
                >
                    <MessageCircleWarning className="mr-2 h-4 w-4" /> Share Experience
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => toggleFilter(filter.id)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${selectedFilters.includes(filter.id)
                                ? "bg-black text-white shadow-lg scale-105"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.length === 0 ? <p className="text-gray-500">No articles found.</p> : null}

                {articles.map((article) => (
                    <Card key={article._id} className={`hover:shadow-md transition-shadow relative ${article.reportCount > 10 ? "border-red-400 bg-red-50 opacity-90" : ""}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold">@{article.authorName}</p>
                                    <p className="text-[10px] text-gray-400">
                                        {new Date(article.date).toLocaleDateString()}
                                    </p>
                                </div>
                                {/* Only show menu if logged in */}
                                {auth?.authenticate && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger><MoreVertical className="h-4 w-4 text-gray-400" /></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {article.authorId === auth?.user?._id ? (
                                                <DropdownMenuItem onClick={() => { setCurrentArticle(article); setFormData(article); setIsModalOpen(true); }}>Edit Article</DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleOpenReport(article)} className="text-red-500">Report</DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {article.reportCount > 10 && auth?.user?._id === article.authorId && (
                                <div className="flex items-center gap-2 mt-2 text-red-600 bg-red-100 p-2 rounded text-xs font-bold">
                                    <EyeOff className="h-4 w-4" />
                                    Hidden from public (High Reports)
                                </div>
                            )}

                            <CardTitle className="text-lg mt-2 line-clamp-2">{article.title}</CardTitle>
                            <span className="inline-block bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded mt-2">{article.category}</span>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 line-clamp-3 mb-2">{article.content}</p>
                            {/* Read More is PUBLIC (No auth check needed) */}
                            <button onClick={() => { setCurrentArticle(article); setIsReadMoreOpen(true); }} className="text-blue-600 text-sm font-semibold hover:underline">Read More</button>
                        </CardContent>
                        <CardFooter className="flex justify-end pt-0">
                            <Button variant="ghost" size="sm" onClick={() => handleWithMe(article._id)}
                                className={`flex gap-2 items-center ${auth?.user && article.withMeUsers.includes(auth?.user?._id) ? "text-red-600 bg-red-50" : "text-gray-500"}`}>
                                <Hand className="h-4 w-4" /> <span className="font-bold">{article.withMeUsers.length}</span> With Me
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* --- REPORT MODAL --- */}
            <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Report Article
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-3 block">Why are you reporting this?</Label>
                        <RadioGroup value={reportReason} onValueChange={setReportReason}>
                            {reportReasons.map((r) => (
                                <div key={r} className="flex items-center space-x-2 mb-2">
                                    <RadioGroupItem value={r} id={r} />
                                    <Label htmlFor={r}>{r}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleSubmitReport}>Submit Report</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{currentArticle?._id ? "Edit Experience" : "Share Your Experience"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <select className="w-full border rounded-md p-2 text-sm" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                <option value="">Select Category</option>
                                {filters.slice(3).map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="h-32" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveArticle}>Post Experience</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Read More Modal */}
            <Dialog open={isReadMoreOpen} onOpenChange={setIsReadMoreOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                    {currentArticle && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold">{currentArticle.title}</h2>
                            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{currentArticle.content}</div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}

export default ArticlePage;