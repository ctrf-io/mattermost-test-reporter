import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseCtrfFile } from "../src/ctrf-parser";
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
		const original = createReport();
		const report = structuredClone(original);
		Object.assign(report, { reportId: "report", runId: "run" });
		report.results.environment = {
			...report.results.environment,
			shardId: "one",
		};
		Object.assign(report.results.tests[1], {
			testId: "logical",
			executionId: "execution",
			attemptId: "final-attempt",
			retryAttempts: [
				{
					attempt: 1,
					attemptId: "prior-attempt",
					status: "failed",
					duration: 1,
					attachments: [
						{
							name: "log",
							path: "prior.txt",
							contentType: "text/plain",
							attachmentId: "prior-ref",
						},
					],
				},
			],
			attachments: [
				{
					name: "log",
					path: "final.txt",
					contentType: "text/plain",
					attachmentId: "final-ref",
				},
			],
		});
		const directory = fs.mkdtempSync(
			path.join(os.tmpdir(), "mattermost-parse-"),
		);
		let parsed: CtrfReport;
		try {
			const file = path.join(directory, "report.json");
			fs.writeFileSync(file, JSON.stringify(report));
			parsed = parseCtrfFile(file);
			expect(parsed).toEqual(report);
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
		const before = structuredClone(parsed);
		const message = formatResultsMessage(parsed) as { text: string };
		expect(message).toEqual(formatResultsMessage(original));
		expect(formatFailedTestsMessage(parsed)).toEqual(
			formatFailedTestsMessage(original),
		);
		expect(formatFlakyTestsMessage(parsed)).toEqual(
			formatFlakyTestsMessage(original),
		);
		expect(parsed).toEqual(before);

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
