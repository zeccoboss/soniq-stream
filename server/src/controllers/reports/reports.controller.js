const {
	createReport,
} = require("../../services/reports/create-report.service");
const { sanitizeReportData } = require("../../services/dto.service");

const submitReport = async (req, res) => {
	try {
		const { targetType, targetUuid, reason, description } = req.body;

		if (!targetType || !targetUuid || !reason) {
			return res.status(400).json({
				success: false,
				message: "targetType, targetUuid, and reason are required",
			});
		}

		const report = await createReport({
			reporterId: req.user._id,
			targetType,
			targetUuid,
			reason,
			description,
		});

		res.status(201).json({
			success: true,
			message: "Report submitted. Our team will review it shortly.",
			data: sanitizeReportData(report),
		});
	} catch (error) {
		const status = error.status || 500;
		res.status(status).json({
			success: false,
			message: status === 500 ? "Failed to submit report" : error.message,
		});
	}
};

module.exports = { submitReport };
