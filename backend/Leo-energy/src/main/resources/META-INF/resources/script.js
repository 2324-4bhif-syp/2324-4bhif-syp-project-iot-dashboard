fetch('/device/data')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(jsonData => {
        // Process the JSON data
        createDevicesTable(jsonData.devices);
        createValuesTable(jsonData.values);
        createValueTypesTable(jsonData.valueTypes);
        createUnitsTable(jsonData.units);
    })
    .catch(error => console.error('Error:', error));

function createDevicesTable(devices) {
    const devicesTable = document.getElementById('devicesTable').getElementsByTagName('tbody')[0];

    for (const device of devices) {
        const row = devicesTable.insertRow();
        row.insertCell(0).textContent = device.id;
        row.insertCell(1).textContent = device.name;
        row.insertCell(2).textContent = device.site;
    }
}

function createValuesTable(values) {
    const valuesTable = document.getElementById('valuesTable').getElementsByTagName('tbody')[0];

    for (const value of values) {
        const row = valuesTable.insertRow();
        row.insertCell(0).textContent = value.id;
        row.insertCell(1).textContent = value.time;
        row.insertCell(2).textContent = value.value;
        row.insertCell(3).textContent = value.valueType.description;
        row.insertCell(4).textContent = value.valueType.unit.name;
    }
}

function createValueTypesTable(valueTypes) {
    const valueTypesTable = document.getElementById('valueTypesTable').getElementsByTagName('tbody')[0];

    for (const valueType of valueTypes) {
        const row = valueTypesTable.insertRow();
        row.insertCell(0).textContent = valueType.id;
        row.insertCell(1).textContent = valueType.description;
        row.insertCell(2).textContent = valueType.presistValues;
        row.insertCell(3).textContent = valueType.sentomqtt;
        row.insertCell(4).textContent = valueType.unit.id;
    }
}

function createUnitsTable(units) {
    const unitsTable = document.getElementById('unitsTable').getElementsByTagName('tbody')[0];

    for (const unit of units) {
        const row = unitsTable.insertRow();
        row.insertCell(0).textContent = unit.id;
        row.insertCell(1).textContent = unit.name;
    }
}