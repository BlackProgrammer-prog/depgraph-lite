import { authenticate } from "./auth.js";
import "./features";
import express from "express";

export const start = () => authenticate();
