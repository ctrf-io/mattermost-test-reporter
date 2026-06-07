import type { CtrfReport } from "../types/ctrf";
import {
	formatFailedTestsMessage,
	formatFlakyTestsMessage,
	formatResultsMessage,
} from "../src/message-formatter";

const createReport = (): CtrfReport =>
	({
		results: {
			tool: {
				name: "vitest",
			},
			summary: {
				tests: 2,
				passed: 1,
				failed: 1,
				skipped: 0,
				pending: 0,
				other: 0,
				start: 0,
				stop: 60,
			},
			environment: {
				buildName: "CI",
				buildNumber: "42",
				buildUrl: "https://example.test/build/42",
			},
			tests: [
				{
					name: "passes",
					status: "passed",
					duration: 1,
				},
				{
					name: "fails",
					status: "failed",
					duration: 1,
					message: "expected true to be false",
					flaky: true,
				},
			],
		},
	}) as CtrfReport;

describe("message formatter", () => {
	it("formats Mattermost result messages", () => {
		const message = formatResultsMessage(createReport()) as { text: string };

		expect(message.text).toContain("CTRF Test Results");
		expect(message.text).toContain("1 failed tests");
		expect(message.text).toContain("[CI #42](https://example.test/build/42)");
	});

	it("formats failed test details", () => {
		expect(formatFailedTestsMessage(createReport())).toContain(
			"Message: expected true to be false",
		);
	});

	it("formats flaky tests and returns null when none exist", () => {
		const report = createReport();
		const message = formatFlakyTestsMessage(report) as { text: string };

		expect(message.text).toContain("Flaky tests detected");
		expect(message.text).toContain("- fails");

		report.results.tests[1].flaky = false;
		expect(formatFlakyTestsMessage(report)).toBeNull();
	});
});
