import { z } from "zod";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import orderModel from "../models/orderModel.js";

//zod validation for singup
const userValidate = z.object({
  name: z.string(),
  email: z
    .string()
    .email()
    .refine((value) => value.includes("@") && value.endsWith(".com"), {
      message: "Invalid email",
    }),
  password: z.string(),
  phone: z.string().refine((value) => /^\d{10}$/.test(value), {
    message: "Phone number must be a 10-digit number",
  }),
  address: z.string(),
  answer: z.string(),
});
const requiredUser = userValidate.required();

// function for sign up route:-/register
export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;
    const validatedData = requiredUser.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).send({
        success: false,
        message: "Validation error",
        errors: validatedData.error.errors,
      });
    }
    // req.validatedData = validatedData;

    // existing user
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "already register please login",
        // data: req.validatedData.data,
      });
    }
    const hashedPassword = await hashPassword(password);
    // console.log(hashedPassword);

    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
      //   password,
    });

    await user.save();
    res.status(200).send({
      success: true,
      message: "Registration successful",
      data: user,
    });
    //validation
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "error in registration",
      error: error.message,
    });
  }
};

// LOGIN POST
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "enter email or password",
      });
    }

    const userforlogin = await userModel.findOne({ email });
    if (!userforlogin) {
      return res.status(400).send({
        success: false,
        message: "email is not registered",
      });
    }

    const match = await comparePassword(password, userforlogin.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "invalid password",
      });
    }
    // console.log(email, password);

    // create token
    const token = await JWT.sign(
      { _id: userforlogin._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.status(200).send({
      success: true,
      message: "login successfully",
      user: {
        name: userforlogin.name,
        email: userforlogin.email,
        phone: userforlogin.phone,
        address: userforlogin.address,
        role: userforlogin.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      messgae: "error in  login",
      error: error.message,
    });
  }
};

//forgotPasswordController

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      res.status(400).send({ message: "Email is required" });
    }
    if (!answer) {
      res.status(400).send({ message: "answer is required" });
    }
    if (!newPassword) {
      res.status(400).send({ message: "New Password is required" });
    }
    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

// test controller
export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

// update profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Passsword is required and 6 character long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error While Update profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Geting Orders try again after some time",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name");
    // .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updating Order",
      error,
    });
  }
};
