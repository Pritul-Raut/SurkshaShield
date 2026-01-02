import { Button } from "@/components/ui/button";
import { Rocket, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ComingSoonPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4 space-y-6">
            <div className="bg-blue-50 p-6 rounded-full animate-pulse">
                <Rocket className="h-20 w-20 text-blue-600" />
            </div>

            <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Coming Soon
                </h1>
                <p className="text-gray-500 max-w-[600px] text-lg">
                    We are working hard to bring you this feature.
                    Stay tuned for updates!
                </p>
            </div>

            <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex items-center gap-2 mt-8"
            >
                <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
        </div>
    );
}

export default ComingSoonPage;