// const paypal = require("../../helpers/paypal");
// const Order = require("../../models/Order");
// const Course = require("../../models/Course");
// const StudentCourses = require("../../models/StudentCourses");

// const createOrder = async (req, res) => {
//   try {
//     const {
//       userId,
//       userName,
//       userEmail,
//       orderStatus,
//       paymentMethod,
//       paymentStatus,
//       orderDate,
//       paymentId,
//       payerId,
//       instructorId,
//       instructorName,
//       courseImage,
//       courseTitle,
//       courseId,
//       coursePricing,
//     } = req.body;

//     const create_payment_json = {
//       intent: "sale",
//       payer: {
//         payment_method: "paypal",
//       },
//       redirect_urls: {
//         return_url: `${process.env.CLIENT_URL}/payment-return`,
//         cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
//       },
//       transactions: [
//         {
//           item_list: {
//             items: [
//               {
//                 name: courseTitle,
//                 sku: courseId,
//                 price: coursePricing,
//                 currency: "USD",
//                 quantity: 1,
//               },
//             ],
//           },
//           amount: {
//             currency: "USD",
//             total: coursePricing.toFixed(2),
//           },
//           description: courseTitle,
//         },
//       ],
//     };

//     paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
//       if (error) {
//         console.log(error);
//         return res.status(500).json({
//           success: false,
//           message: "Error while creating paypal payment!",
//         });
//       } else {
//         const newlyCreatedCourseOrder = new Order({
//           userId,
//           userName,
//           userEmail,
//           orderStatus,
//           paymentMethod,
//           paymentStatus,
//           orderDate,
//           paymentId,
//           payerId,
//           instructorId,
//           instructorName,
//           courseImage,
//           courseTitle,
//           courseId,
//           coursePricing,
//         });

//         await newlyCreatedCourseOrder.save();

//         const approveUrl = paymentInfo.links.find(
//           (link) => link.rel == "approval_url"
//         ).href;

//         res.status(201).json({
//           success: true,
//           data: {
//             approveUrl,
//             orderId: newlyCreatedCourseOrder._id,
//           },
//         });
//       }
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

// const capturePaymentAndFinalizeOrder = async (req, res) => {
//   try {
//     const { paymentId, payerId, orderId } = req.body;

//     let order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order can not be found",
//       });
//     }

//     order.paymentStatus = "paid";
//     order.orderStatus = "confirmed";
//     order.paymentId = paymentId;
//     order.payerId = payerId;

//     await order.save();

//     //update out student course model
//     const studentCourses = await StudentCourses.findOne({
//       userId: order.userId,
//     });

//     if (studentCourses) {
//       studentCourses.courses.push({
//         courseId: order.courseId,
//         title: order.courseTitle,
//         instructorId: order.instructorId,
//         instructorName: order.instructorName,
//         dateOfPurchase: order.orderDate,
//         courseImage: order.courseImage,
//       });

//       await studentCourses.save();
//     } else {
//       const newStudentCourses = new StudentCourses({
//         userId: order.userId,
//         courses: [
//           {
//             courseId: order.courseId,
//             title: order.courseTitle,
//             instructorId: order.instructorId,
//             instructorName: order.instructorName,
//             dateOfPurchase: order.orderDate,
//             courseImage: order.courseImage,
//           },
//         ],
//       });

//       await newStudentCourses.save();
//     }

//     //update the course schema students
//     await Course.findByIdAndUpdate(order.courseId, {
//       $addToSet: {
//         students: {
//           studentId: order.userId,
//           studentName: order.userName,
//           studentEmail: order.userEmail,
//           paidAmount: order.coursePricing,
//         },
//       },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Order confirmed",
//       data: order,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

// module.exports = { createOrder, capturePaymentAndFinalizeOrder };


const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Course = require("../../models/Course");
const StudentCourses = require("../../models/StudentCourses");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      orderStatus,
      paymentMethod,
      paymentStatus,
      orderDate,
      paymentId,
      payerId,
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
    } = req.body;

    // ============================================================
    //  DEV MODE: INSTANT BUY (Bypass PayPal)
    // ============================================================
    
    // 1. Check if user already has the course (prevent duplicates)
    let studentCourses = await StudentCourses.findOne({ userId });
    if (studentCourses) {
      const alreadyBought = studentCourses.courses.find(
        (item) => item.courseId === courseId
      );
      if (alreadyBought) {
        return res.status(200).json({
          success: true,
          message: "You already bought this course",
        });
      }
    }

    // 2. Create the Order Record (Marked as PAID immediately)
    const newlyCreatedCourseOrder = new Order({
      userId,
      userName,
      userEmail,
      orderStatus: "confirmed", // Force confirmed
      paymentMethod: "dev-bypass",
      paymentStatus: "paid",    // Force paid
      orderDate: new Date(),
      paymentId: "dev_id_" + Math.random(),
      payerId: "dev_payer_" + Math.random(),
      instructorId,
      instructorName,
      courseImage,
      courseTitle,
      courseId,
      coursePricing,
    });

    await newlyCreatedCourseOrder.save();

    // 3. Add Course to Student's List
    if (studentCourses) {
      studentCourses.courses.push({
        courseId,
        title: courseTitle,
        instructorId,
        instructorName,
        dateOfPurchase: new Date(),
        courseImage,
      });
      await studentCourses.save();
    } else {
      const newStudentCourses = new StudentCourses({
        userId,
        courses: [
          {
            courseId,
            title: courseTitle,
            instructorId,
            instructorName,
            dateOfPurchase: new Date(),
            courseImage,
          },
        ],
      });
      await newStudentCourses.save();
    }

    // 4. Update Course Schema (Add student to the course)
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: {
        students: {
          studentId: userId,
          studentName: userName,
          studentEmail: userEmail,
          paidAmount: coursePricing,
        },
      },
    });

    // 5. Respond Success
    return res.status(200).json({
      success: true,
      data: {
        // We don't send an approval URL, just the order ID
        orderId: newlyCreatedCourseOrder._id,
      },
    });

    // ============================================================
    //  END OF DEV MODE
    // ============================================================

    /* // ============================================================
    //  ORIGINAL PAYPAL CODE (Uncomment this later)
    // ============================================================
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/payment-return`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: courseTitle,
                sku: courseId,
                price: coursePricing,
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: coursePricing.toFixed(2),
          },
          description: courseTitle,
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          success: false,
          message: "Error while creating paypal payment!",
        });
      } else {
        const newlyCreatedCourseOrder = new Order({
          userId,
          userName,
          userEmail,
          orderStatus,
          paymentMethod,
          paymentStatus,
          orderDate,
          paymentId,
          payerId,
          instructorId,
          instructorName,
          courseImage,
          courseTitle,
          courseId,
          coursePricing,
        });

        await newlyCreatedCourseOrder.save();

        const approveUrl = paymentInfo.links.find(
          (link) => link.rel == "approval_url"
        ).href;

        res.status(201).json({
          success: true,
          data: {
            approveUrl,
            orderId: newlyCreatedCourseOrder._id,
          },
        });
      }
    });
    // ============================================================
    */

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const capturePaymentAndFinalizeOrder = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    await order.save();

    //update out student course model
    const studentCourses = await StudentCourses.findOne({
      userId: order.userId,
    });

    if (studentCourses) {
      studentCourses.courses.push({
        courseId: order.courseId,
        title: order.courseTitle,
        instructorId: order.instructorId,
        instructorName: order.instructorName,
        dateOfPurchase: order.orderDate,
        courseImage: order.courseImage,
      });

      await studentCourses.save();
    } else {
      const newStudentCourses = new StudentCourses({
        userId: order.userId,
        courses: [
          {
            courseId: order.courseId,
            title: order.courseTitle,
            instructorId: order.instructorId,
            instructorName: order.instructorName,
            dateOfPurchase: order.orderDate,
            courseImage: order.courseImage,
          },
        ],
      });

      await newStudentCourses.save();
    }

    //update the course schema students
    await Course.findByIdAndUpdate(order.courseId, {
      $addToSet: {
        students: {
          studentId: order.userId,
          studentName: order.userName,
          studentEmail: order.userEmail,
          paidAmount: order.coursePricing,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = { createOrder, capturePaymentAndFinalizeOrder };