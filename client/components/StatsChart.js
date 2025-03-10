"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_chartjs_2_1 = require("react-chartjs-2");
const chart_js_1 = require("chart.js");
chart_js_1.Chart.register(chart_js_1.CategoryScale, chart_js_1.LinearScale, chart_js_1.BarElement, chart_js_1.Title, chart_js_1.Tooltip, chart_js_1.Legend);
const StatsChart = ({ labels, data }) => {
    const chartData = {
        labels,
        datasets: [
            {
                label: 'WPM (Słowa na minutę)',
                data,
                backgroundColor: '#2a71d0',
            },
        ],
    };
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Historia prędkości pisania',
            },
        },
    };
    return <react_chartjs_2_1.Bar data={chartData} options={options}/>;
};
exports.default = StatsChart;
