import React, { useEffect, useState } from 'react';
import '../homepage/stock.css';
import { useTicker } from '../../globalcontext/TickerContext';
import { useLocation } from 'react-router-dom';

const dummyIncome = 
[
    {
    "date": "2023-09-24",
    "symbol": "AAPL",
    "reportedCurrency": "USD",
    "cik": "0000320193",
    "fillingDate": "2023-10-28",
    "acceptedDate": "2023-10-27 18:01:14",
    "calendarYear": "2023",
    "period": "FY",
    "revenue": 400000000000,
    "costOfRevenue": 225000000000,
    "grossProfit": 175000000000,
    "grossProfitRatio": 0.4375,
    "researchAndDevelopmentExpenses": 26500000000,
    "generalAndAdministrativeExpenses": 500000000,
    "sellingAndMarketingExpenses": 300000000,
    "sellingGeneralAndAdministrativeExpenses": 25500000000,
    "otherExpenses": -500000000,
    "operatingExpenses": 52000000000,
    "costAndExpenses": 278000000000,
    "interestIncome": 3000000000,
    "interestExpense": 2900000000,
    "depreciationAndAmortization": 11200000000,
    "ebitda": 132000000000,
    "ebitdaratio": 0.33,
    "operatingIncome": 121000000000,
    "operatingIncomeRatio": 0.303,
    "totalOtherIncomeExpensesNet": -500000000,
    "incomeBeforeTax": 120500000000,
    "incomeBeforeTaxRatio": 0.302,
    "incomeTaxExpense": 19500000000,
    "netIncome": 101000000000,
    "netIncomeRatio": 0.2525,
    "eps": 6.20,
    "epsdiluted": 6.15,
    "weightedAverageShsOut": 16300000000,
    "weightedAverageShsOutDil": 16400000000,
  }
];


const dummyBalance = 
[
    {
            "date": "2022-09-24",
            "symbol": "AAPL",
            "reportedCurrency": "USD",
            "cik": "0000320193",
            "fillingDate": "2022-10-28",
            "acceptedDate": "2022-10-27 18:01:14",
            "calendarYear": "2022",
            "period": "FY",
            "cashAndCashEquivalents": 23646000000,
            "shortTermInvestments": 24658000000,
            "cashAndShortTermInvestments": 48304000000,
            "netReceivables": 60932000000,
            "inventory": 4946000000,
            "otherCurrentAssets": 21223000000,
            "totalCurrentAssets": 135405000000,
            "propertyPlantEquipmentNet": 42117000000,
            "goodwill": 0,
            "intangibleAssets": 0,
            "goodwillAndIntangibleAssets": 0,
            "longTermInvestments": 120805000000,
            "taxAssets": 0,
            "otherNonCurrentAssets": 54428000000,
            "totalNonCurrentAssets": 217350000000,
            "otherAssets": 0,
            "totalAssets": 352755000000,
            "accountPayables": 64115000000,
            "shortTermDebt": 21110000000,
            "taxPayables": 0,
            "deferredRevenue": 7912000000,
            "otherCurrentLiabilities": 60845000000,
            "totalCurrentLiabilities": 153982000000,
            "longTermDebt": 98959000000,
            "deferredRevenueNonCurrent": 0,
            "deferredTaxLiabilitiesNonCurrent": 0,
            "otherNonCurrentLiabilities": 49142000000,
            "totalNonCurrentLiabilities": 148101000000,
            "otherLiabilities": 0,
            "capitalLeaseObligations": 0,
            "totalLiabilities": 302083000000,
            "preferredStock": 0,
            "commonStock": 64849000000,
            "retainedEarnings": -3068000000,
            "accumulatedOtherComprehensiveIncomeLoss": -11109000000,
            "othertotalStockholdersEquity": 0,
            "totalStockholdersEquity": 50672000000,
            "totalEquity": 50672000000,
            "totalLiabilitiesAndStockholdersEquity": 352755000000,
            "minorityInterest": 0,
            "totalLiabilitiesAndTotalEquity": 352755000000,
            "totalInvestments": 145463000000,
            "totalDebt": 120069000000,
            "netDebt": 96423000000,
            "link": "https://www.sec.gov/Archives/edgar/data/320193/000032019322000108/0000320193-22-000108-index.htm",
            "finalLink": "https://www.sec.gov/Archives/edgar/data/320193/000032019322000108/aapl-20220924.htm"
    }
]


    const dummyCashflow = [
        {
            "date": "2022-09-24",
            "symbol": "AAPL",
            "reportedCurrency": "USD",
            "cik": "0000320193",
            "fillingDate": "2022-10-28",
            "acceptedDate": "2022-10-27 18:01:14",
            "calendarYear": "2022",
            "period": "FY",
            "netIncome": 99803000000,
            "depreciationAndAmortization": 11104000000,
            "deferredIncomeTax": 895000000,
            "stockBasedCompensation": 9038000000,
            "changeInWorkingCapital": 1200000000,
            "accountsReceivables": -1823000000,
            "inventory": 1484000000,
            "accountsPayables": 9448000000,
            "otherWorkingCapital": -7909000000,
            "otherNonCashItems": 111000000,
            "netCashProvidedByOperatingActivities": 122151000000,
            "investmentsInPropertyPlantAndEquipment": -10708000000,
            "acquisitionsNet": -306000000,
            "purchasesOfInvestments": -76923000000,
            "salesMaturitiesOfInvestments": 67363000000,
            "otherInvestingActivites": -1780000000,
            "netCashUsedForInvestingActivites": -22354000000,
            "debtRepayment": -9543000000,
            "commonStockIssued": 0,
            "commonStockRepurchased": -89402000000,
            "dividendsPaid": -14841000000,
            "otherFinancingActivites": 3037000000,
            "netCashUsedProvidedByFinancingActivities": -110749000000,
            "effectOfForexChangesOnCash": 0,
            "netChangeInCash": -10952000000,
            "cashAtEndOfPeriod": 24977000000,
            "cashAtBeginningOfPeriod": 35929000000,
            "operatingCashFlow": 122151000000,
            "capitalExpenditure": -10708000000,
            "freeCashFlow": 111443000000,
            "link": "https://www.sec.gov/Archives/edgar/data/320193/000032019322000108/0000320193-22-000108-index.htm",
            "finalLink": "https://www.sec.gov/Archives/edgar/data/320193/000032019322000108/aapl-20220924.htm"
        }
    ]

function Statements () {

    console.log("StockTable - searchData:");


    const [data, setData] = useState([]); // State to store fetched data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const key = "76aca232cf48b7732e7d62cf2fd91072";
    const location = useLocation();
    const { selectedTicker: tickerFromContext } = useTicker();

    const selectedTicker = location.state?.selectedTicker || tickerFromContext || 'AAPL';

    console.log("Passed through location:", selectedTicker);


    const [dataType, setDataType] = useState('income-statement');

    const [isAnnual, setIsAnnual] = useState(true);


    const handlePeriodChange = () => {
        setIsAnnual(!isAnnual);
    };


    const handleTypeClick = (newDataType) => {
        setDataType(newDataType);

    };

    console.log("Passed SelectedTicker:", selectedTicker);


    const period = isAnnual ? "annual" : "quarterly"; // Determine the period

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors


            // Check if the ticker is available
            const ticker = selectedTicker?.symbol || selectedTicker;

            console.log("Ticker:", ticker);
            
            if (!ticker) {
                setError("No ticker symbol provided.");
                return;
            }

            // Determine if the period is annual or quarterly
            const period = isAnnual ? "annual" : "quarterly";

            // Construct the API URL using dataType, ticker, period, and API key
            const url = `https://financialmodelingprep.com/api/v3/${dataType}/${ticker}?period=${period}&apikey=${key}&limit=1`;

            console.log("Fetching data with URL:", url); // Log the API URL for debugging

            const response = await fetch(url);
            const result = await response.json(); // Parse JSON response

            console.log("StockTable: Ticker", ticker);
            console.log("StockTable: Result", result);
            

            if (response.ok && result.length > 0) {
                setData(result); // Set the data if the response is valid
            } else {
                setError("No data found or error fetching data.");
                setData([]); // Clear data if there's an issue
            }
        } catch (e) {
            setError(`Error Fetching: ${e.message}`); // Handle any fetch errors
            setData([]); // Clear the data in case of error
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };



    useEffect(() => {
        //console.log("useEffect triggered");
        //console.log("searchData in useEffect:", searchData); // Add this line
        // if (searchData?.symbol) {
        fetchData();
        // }
        console.log("types", selectedTicker, dataType, period);

    }, [selectedTicker, dataType, isAnnual]);


    //const dataToRender = getDataToRender();
    //console.log("dataToRender:", dataToRender);
    //console.log("getDatatoRender", getDataToRender);
    return (
        <div className='fin-container'>
            <div className='period-column'>
                <div className='data-type-buttons'>
                    <button className="tab-button" onClick={() => handleTypeClick("income-statement")}>Income Statement</button>
                    <button className="tab-button" onClick={() => handleTypeClick("balance-sheet-statement")}>Balance Sheet</button>
                    <button className="tab-button" onClick={() => handleTypeClick("cash-flow-statement")}>Cash Flow</button>
                </div>
            </div>
    
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(data) && data.length > 0 ? (
                            data.map((item, index) => (
                                <React.Fragment key={index}>
                                    {Object.entries(item).map(([key, value]) => (
                                        key !== "link" && key !== "finalLink" && (
                                            <tr key={`${index}-${key}`}>
                                                <td className="metric-key">{key}</td>
                                                <td className="metric-value">{value !== null ? value.toString() : 'N/A'}</td>
                                            </tr>
                                        )
                                    ))}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2" className="no-data">No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
}

export default Statements;