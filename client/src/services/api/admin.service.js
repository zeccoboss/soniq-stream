import { ENDPOINTS } from "./endpoints";
import { BaseService } from "./base.service";

class AdminService extends BaseService {
	// ── Admin Overview ───────────────────────────────────────────────
	getOverview({ signal } = {}) {
		return this.get(ENDPOINTS.ADMIN.OVERVIEW, { signal });
	}

	// ── Admin Stats ───────────────────────────────────────────────
	getStats({ signal } = {}) {
		return this.get(ENDPOINTS.ADMIN.STATS, { signal });
	}

	// ── Admin Users ───────────────────────────────────────────────
	getUsers({ limit, cursor, order, signal } = {}) {
		return this.get(ENDPOINTS.ADMIN.USERS, {
			params: { limit, cursor, order },
			signal,
		});
	}

	// ── Admin Tracks ───────────────────────────────────────────────
	getTracks({ limit, cursor, order, signal } = {}) {
		return this.get(ENDPOINTS.ADMIN.TRACKS, {
			params: { limit, cursor, order },
			signal,
		});
	}

	// ── Admin Reports ───────────────────────────────────────────────
	getReports({ limit, cursor, status, signal } = {}) {
		return this.get(ENDPOINTS.ADMIN.REPORTS, {
			params: { limit, cursor, status },
			signal,
		});
	}

	// ── Admin Actions ───────────────────────────────────────────────
	updateReportStatus(report_uuid, status, resolutionNote) {
		return this.patch(ENDPOINTS.ADMIN.RESOLVE_REPORT(report_uuid), {
			status,
			resolutionNote,
		});
	}

	// ── Admin Content Management ─────────────────────────────────────
	deleteTrack(track_uuid) {
		return this.delete(ENDPOINTS.ADMIN.DELETE_TRACK(track_uuid));
	}

	// ── Admin User Management ───────────────────────────────────────
	updateUserRole(user_uuid, newRole) {
		return this.patch(ENDPOINTS.ADMIN.UPDATE_USER_ROLE(user_uuid), {
			newRole, // see note below — must match what the backend reads
		});
	}

	toggleUserStatus(user_uuid) {
		return this.patch(ENDPOINTS.ADMIN.TOGGLE_USER_STATUS(user_uuid));
	}
}

export const adminService = new AdminService();
