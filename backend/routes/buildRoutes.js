import express from "express";
import {getBuild} from "../controllers/buildController.js";

const router = express.Router();

router.get('/:buildNumber', getBuild);

export default router;
