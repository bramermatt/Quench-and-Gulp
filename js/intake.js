document.addEventListener("DOMContentLoaded", function () {
    setupDatabase();
    fetchIntakeHistory();

    const waterAmountSelect = document.getElementById("waterAmount");
    const customAmountInput = document.getElementById("customAmount");
    const drinkTypeSelect = document.getElementById("drinkType");
    const customDrinkInput = document.getElementById("customDrink");

    // Show input box if "Custom" is selected, hide otherwise
    waterAmountSelect.addEventListener("change", function () {
        if (this.value === "custom") {
            customAmountInput.style.display = "block";
            customAmountInput.focus();
        } else {
            customAmountInput.style.display = "none";
        }
    });

    drinkTypeSelect.addEventListener("change", function () {
        if (this.value === "custom") {
            customDrinkInput.style.display = "block";
            customDrinkInput.focus();
        } else {
            customDrinkInput.style.display = "none";
        }
    });
});

function setupDatabase() {
    const request = indexedDB.open("WaterIntakeDB", 1);

    request.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("intake")) {
            const store = db.createObjectStore("intake", { keyPath: "id", autoIncrement: true });
            store.createIndex("date", "date", { unique: false });  // Index for date-based lookup
        }
    };

    request.onsuccess = function () {
        console.log("Database initialized successfully!");
    };

    request.onerror = function (event) {
        console.error("Database error:", event.target.error);
    };
}

function addWaterIntake() {
    let amount = document.getElementById("waterAmount").value;
    const customAmount = document.getElementById("customAmount").value;
    let drinkType = document.getElementById("drinkType").value;
    const customDrink = document.getElementById("customDrink").value;

    if (amount === "custom") {
        amount = customAmount;
    }

    if (drinkType === "custom") {
        drinkType = customDrink;
    }

    amount = parseFloat(amount);

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (!drinkType) {
        alert("Please enter a drink type.");
        return;
    }

    addIntake(amount, drinkType);
}

function addIntake(amount, drinkType) {
    const request = indexedDB.open("WaterIntakeDB", 1);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction("intake", "readwrite");
        const store = transaction.objectStore("intake");

        const now = new Date();
        const intakeRecord = {
            date: now.toISOString().split("T")[0], // YYYY-MM-DD
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }), // HH:MM AM/PM
            amount: amount,
            drinkType: drinkType
        };

        store.add(intakeRecord).onsuccess = function () {
            console.log("Intake recorded:", intakeRecord);
            fetchIntakeHistory(); // Refresh history after adding
        };
    };
}

function fetchIntakeHistory() {
    const request = indexedDB.open("WaterIntakeDB", 1);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction("intake", "readonly");
        const store = transaction.objectStore("intake");

        const dataRequest = store.getAll();
        dataRequest.onsuccess = function () {
            const historyList = document.getElementById("intakeHistory");
            historyList.innerHTML = "";

            dataRequest.result.forEach(record => {
                const listItem = document.createElement("li");
                listItem.textContent = `${record.date} at ${record.time}: ${record.amount} oz of ${record.drinkType}`;
                historyList.appendChild(listItem);
            });

            // Show the history container once there's data
            if (dataRequest.result.length > 0) {
                document.getElementById("historyContainer").style.display = "block";
            }
        };
    };
}

function clearHistory() {
    const request = indexedDB.open("WaterIntakeDB", 1);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction("intake", "readwrite");
        const store = transaction.objectStore("intake");

        store.clear().onsuccess = function () {
            console.log("Intake history cleared.");
            document.getElementById("intakeHistory").innerHTML = "";
            document.getElementById("historyContainer").style.display = "none"; // Hide the history container
        };
    };
}

function validateInput(event) {
    // Allow only numbers (prevent anything that's not a digit)
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');  // Replace non-digit characters
}

function handleEnterKey(event) {
    if (event.key === "Enter") {
        addWaterIntake(); // Trigger addWaterIntake on Enter key press
    }
}
