import express from "express";
import { startSession, pauseSession, getSession, resumeSession, handleDefect, handlePopup, handleSubmit} from "../controllers/sessionController.js";

const router = express.Router();

router.post('/start', startSession); //start/resume session for loginId, buildNumber

router.post('/pause', pauseSession); //record pause timestamp

router.get('/active/:loginId', getSession); //get acive session

router.post('/resume', resumeSession); // record resume timestamp

router.post('/defect', handleDefect); //update defect count

router.post('/popup', handlePopup); // handle popup logic

router.post('/submit', handleSubmit); //Final submission with totalParts


export default router;