import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Business } from "../models/Business.js";
import { env } from "../config/env.js";

async function userPayload(user: InstanceType<typeof User>) {
  const business = user.businessIds[0]
    ? await Business.findById(user.businessIds[0]).select("name slug")
    : null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    businessSlug: business?.slug,
    onboardingComplete: Boolean(
      business?.name?.trim() && business?.slug?.trim(),
    ),
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });

  if (existing) {
    throw new Error("A user with that email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: "owner",
  });

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    {
      expiresIn: "7d",
    },
  );

  return {
    user: await userPayload(user),
    token,
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select(
    "+passwordHash",
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);

  if (!valid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    {
      expiresIn: "7d",
    },
  );

  return {
    user: await userPayload(user),
    token,
  };
}

export async function createStaffUser(input: {
  name: string;
  email: string;
  password: string;
  businessId: string;
}) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });

  if (existing) {
    throw new Error("A user with that email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: "staff",
    businessIds: [input.businessId],
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
