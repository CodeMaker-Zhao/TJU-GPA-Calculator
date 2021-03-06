// let changeColor = document.getElementById("changeColor");
// let form = document.querySelector('form');
const button = document.querySelector("#start");
const rgpa = document.querySelector("#rgpa .result");
const agpa = document.querySelector("#agpa .result");
const rscore = document.querySelector("#rscore .result");
const ascore = document.querySelector("#ascore .result");
const container = document.querySelector(".container");

chrome.storage.sync.get(
	["allGpa", "allScore", "requiredGpa", "requiredScore"],
	({ allGpa, allScore, requiredGpa, requiredScore }) => {
		agpa.innerText = allGpa;
		ascore.innerText = allScore;
		rgpa.innerText = requiredGpa;
		rscore.innerText = requiredScore;
	}
);

button.addEventListener(
	"click",
	async function (event) {
		event.preventDefault();
		let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		chrome.scripting.executeScript(
			{
				target: { tabId: tab.id },
				function: calculateGpa,
			},
			function (injectionResults) {
				try {
					const result = injectionResults[0].result;
					const [allGpa, allScore, requiredGpa, requiredScore] = result;
					container.classList.add("pre-animation");
					setTimeout(function () {
						agpa.innerText = allGpa;
						ascore.innerText = allScore;
						rgpa.innerText = requiredGpa;
						rscore.innerText = requiredScore;
					}, 550);
					setTimeout(function () {
						container.classList.remove("pre-animation");
					}, 600);

					chrome.storage.sync.set({
						allGpa,
						allScore,
						requiredGpa,
						requiredScore,
					});
				} catch (error) {
					console.error(error);
				}
			}
		);
	},
	false
);

// When the button is clicked, inject setPageBackgroundColor into current page
// changeColor.addEventListener("click", async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// });

// The body of this function will be executed as a content script inside the
// current page
function calculateGpa() {
	try {
	const iframe = document.getElementById("iframeMain");
	const iDocument = iframe.contentWindow.document;
	const table = iDocument.querySelectorAll("table")[3];
	const headers = Array.from(table.querySelectorAll("thead tr th"));
	const trs = table.querySelectorAll("tbody tr");
	const formatNumber = (number) => (Math.round(number * 100) / 100).toFixed(2);
	let totalAllCredit = 0,
		totalRequiredCredit = 0,
		totalAllScore = 0,
		totalRequiredScore = 0,
		totalAllGpa = 0,
		totalRequiredGpa = 0;
	const scoreArr = [90, 85, 82, 78, 75, 72, 68, 64, 60, 0];
	const gpaArr = [4, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.5, 1.0, 0];
	const requiredColumn =
		headers.findIndex((item) => item.innerText === "????????????") === -1
			? headers.findIndex((item) => item.innerText === "????????????")
			: headers.findIndex((item) => item.innerText === "????????????");
	const creditColumn = headers.findIndex((item) => item.innerText === "??????");
	const scoreColumn = headers.findIndex(
		(item) => item.innerText === "??????" || item.innerText === "??????"
	);
	const classNameColumn = headers.findIndex(item => item.innerText === '????????????');
	console.log(requiredColumn, creditColumn, scoreColumn);
	for (let i = 0; i < trs.length; i++) {
		const tds = trs[i].querySelectorAll("td");
		console.log(
			"required",
			tds[requiredColumn].innerText,
			tds[requiredColumn].innerText === "?????????" ||
				tds[requiredColumn].innerText === "??????"
		);
		const isRequired =
			tds[requiredColumn].innerText === "?????????" ||
			tds[requiredColumn].innerText === "??????";
		const credit = Number(tds[creditColumn].innerText);
		const score = Number(tds[scoreColumn].innerText);
		if (
			isNaN(score) ||
			isNaN(credit) ||
			tds[classNameColumn].innerText.includes('??????')
		) {
			console.log(`${tds[classNameColumn].innerText}?????????????????????????????????, ?????????,??????????????????,???????????????`);
			continue;
		}
		const gpa = gpaArr[scoreArr.findIndex((item) => score >= item)];
		// console.log(
		// 	"????????????",
		// 	tds[classNameColumn],
		// 	"????????????",
		// 	isRequired,
		// 	"??????",
		// 	credit,
		// 	"??????",
		// 	score,
		// 	"GPA",
		// 	gpa
		// );
		totalAllCredit += credit;
		totalAllGpa += gpa * credit;
		totalAllScore += score * credit;
		if (isRequired) {
			totalRequiredCredit += credit;
			totalRequiredGpa += gpa * credit;
			totalRequiredScore += score * credit;
		}
	}
	console.log("?????????", totalAllCredit, "????????????", totalRequiredCredit, "?????????", totalAllScore, "???GPA", totalAllGpa);
	if (totalRequiredCredit !== 0 && totalAllCredit !== 0) {
		const allGpa = formatNumber(totalAllGpa / totalAllCredit),
			allScore = formatNumber(totalAllScore / totalAllCredit),
			requiredGpa = formatNumber(totalRequiredGpa / totalRequiredCredit),
			requiredScore = formatNumber(totalRequiredScore / totalRequiredCredit);
		return [allGpa, allScore, requiredGpa, requiredScore];
	} else if (totalAllCredit !== 0) {
		const allGpa = formatNumber(totalAllGpa / totalAllCredit),
			allScore = formatNumber(totalAllScore / totalAllCredit);
		return [allGpa, allScore, 0, 0];
	} else {
		return [0, 0, 0, 0];
	}
	} catch (error) {
		console.error(error);
		alert(`????????????????????????????????????????????????\n1??????????????????????????????\n2??????Chrome???????????????????????????Chrome????????????\n????????????????????????????????????????????????????????????????????????Console(?????????)?????????????????????zlq1440169549`);
	}
}
