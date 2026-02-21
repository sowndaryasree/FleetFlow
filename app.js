import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc ,getDoc} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2mpX7DYeJOIOYmo-Vbgk-8KJ2Hb6kIE8",
  authDomain: "fleetflowapp-61512.firebaseapp.com",
  projectId: "fleetflowapp-61512",
  storageBucket: "fleetflowapp-61512.firebasestorage.app",
  messagingSenderId: "877077365146",
  appId: "1:877077365146:web:2ca08718c50fa947ea7a23"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* LOGIN */
window.login = function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)

    .then(() => {

      // Hide login section
      document.getElementById("loginSection").classList.add("hidden");

      // Show main app
      document.getElementById("appSection").classList.remove("hidden");

      // Load dashboard
      loadDashboard();

    })

    .catch(error => {
      alert(error.message);
      console.log(error);
    });
};
/* LOGOUT */
window.logout = function () {
  signOut(auth).then(() => location.reload());
};

/* DASHBOARD */
window.loadDashboard = async function () {

  const vehicleSnap = await getDocs(collection(db, "vehicles"));
  const tripSnap = await getDocs(collection(db, "trips"));
  const maintenanceSnap = await getDocs(collection(db, "maintenance"));
  const fuelSnap = await getDocs(collection(db, "fuelLogs"));

  const totalVehicles = vehicleSnap.size;

  let activeTrips = 0;
  tripSnap.forEach(doc => {
    if (doc.data().status === "Dispatched") activeTrips++;
  });

  let totalMaintenanceCost = 0;
  maintenanceSnap.forEach(doc => {
    totalMaintenanceCost += doc.data().cost || 0;
  });

  let totalFuelCost = 0;
  fuelSnap.forEach(doc => {
    totalFuelCost += doc.data().cost || 0;
  });

  const fleetUtilization = totalVehicles === 0
    ? 0
    : ((activeTrips / totalVehicles) * 100).toFixed(1);

  const totalOperationalCost = totalMaintenanceCost + totalFuelCost;

  // BUILD HTML
  let html = `
    <h2>Fleet Analytics</h2>

    <div class="analytics-grid">
      <div class="card-box">
        <h3>Total Vehicles</h3>
        <p>${totalVehicles}</p>
      </div>

      <div class="card-box">
        <h3>Active Trips</h3>
        <p>${activeTrips}</p>
      </div>

      <div class="card-box">
        <h3>Fleet Utilization</h3>
        <p>${fleetUtilization}%</p>
      </div>

      <div class="card-box">
        <h3>Fuel Cost</h3>
        <p>₹${totalFuelCost}</p>
      </div>

      <div class="card-box">
        <h3>Maintenance Cost</h3>
        <p>₹${totalMaintenanceCost}</p>
      </div>

      <div class="card-box">
        <h3>Total Operational Cost</h3>
        <p>₹${totalOperationalCost}</p>
      </div>
    </div>

    <canvas id="costChart" height="100"></canvas>
  `;

  // Inject HTML FIRST
  document.getElementById("contentArea").innerHTML = html;

  // Animate AFTER rendering
  animateCounter(".card-box p");

  // Create Chart AFTER canvas exists
  new Chart(document.getElementById("costChart"), {
    type: 'bar',
    data: {
      labels: ['Fuel', 'Maintenance'],
      datasets: [{
        label: 'Cost Overview',
        data: [totalFuelCost, totalMaintenanceCost],
        backgroundColor: ['#a855f7', '#ef4444']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#e2e8f0" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#c084fc" }
        },
        y: {
          ticks: { color: "#c084fc" }
        }
      }
    }
  });

};


// Counter function OUTSIDE dashboard
function animateCounter(selector) {

  document.querySelectorAll(selector).forEach(el => {

    const target = Number(el.innerText.replace(/[^\d]/g, ''));
    let count = 0;
    const speed = 20;

    const update = () => {
      if (count < target) {
        count += Math.ceil(target / 50);
        el.innerText = count;
        setTimeout(update, speed);
      } else {
        el.innerText = target;
      }
    };

    update();
  });

}
/* VEHICLES */
window.loadVehicles = async function () {
  const snap = await getDocs(collection(db, "vehicles"));

  let html = `
    <h2>Vehicle Registry</h2>

    <div class="form-row">
      <input id="vName" placeholder="Vehicle Name">
      <input id="vCapacity" type="number" placeholder="Capacity (kg)">
      <input id="vOdometer" type="number" placeholder="Odometer (km)">
      <button onclick="addVehicle()">Add</button>
    </div>

    <table class="data-table">
      <tr>
        <th>Name</th>
        <th>Capacity</th>
        <th>Odometer</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
  `;

  snap.forEach(docSnap => {
    const v = docSnap.data();

    html += `
      <tr>
        <td>${v.name}</td>
        <td>${v.capacity}kg</td>
        <td>${v.odometer || 0}km</td>
        <td><span class="badge ${v.status.toLowerCase().replace(" ", "")}">
            ${v.status}
        </span></td>
        <td>
          <button onclick="retireVehicle('${docSnap.id}')">Retire</button>
        </td>
      </tr>
    `;
  });

  html += `</table>`;

  document.getElementById("contentArea").innerHTML = html;
};

window.addVehicle = async function () {
  const name = document.getElementById("vName").value;
  const capacity = document.getElementById("vCapacity").value;
  const odometer = document.getElementById("vOdometer").value;

  if (!name || !capacity || !odometer) {
    alert("Fill all fields");
    return;
  }

  await addDoc(collection(db, "vehicles"), {
    name,
    capacity: Number(capacity),
    odometer: Number(odometer),
    status: "Available"
  });

  loadVehicles();
};

window.retireVehicle = async function (id) {
  await updateDoc(doc(db, "vehicles", id), {
    status: "Retired"
  });

  loadVehicles();
};
window.loadDrivers = async function () {
  const snap = await getDocs(collection(db, "drivers"));

  let html = `
    <h2>Driver Management</h2>

    <div class="form-row">
      <input id="dName" placeholder="Driver Name">
      <input id="dExpiry" type="date">
      <button onclick="addDriver()">Add Driver</button>
    </div>

    <table class="data-table">
      <tr>
        <th>Name</th>
        <th>License Expiry</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
  `;

  const today = new Date();

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const expiryDate = new Date(d.licenseExpiry);

    let status = d.status;

    // Auto expiry logic
    if (expiryDate < today) {
      status = "Suspended";
    }

    html += `
      <tr>
        <td>${d.name}</td>
        <td>${d.licenseExpiry}</td>
        <td><span class="badge ${status.toLowerCase().replace(" ", "")}">
            ${status}
        </span></td>
        <td>
  ${status !== "Suspended"
      ? `<button onclick="suspendDriver('${docSnap.id}')">Suspend</button>`
      : `<span style="color:#94a3b8;">No Action</span>`
  }
</td>
      </tr>
    `;
  });

  html += `</table>`;

  document.getElementById("contentArea").innerHTML = html;
};

window.addDriver = async function () {
  const name = document.getElementById("dName").value;
  const expiry = document.getElementById("dExpiry").value;

  if (!name || !expiry) {
    alert("Fill all fields");
    return;
  }

  await addDoc(collection(db, "drivers"), {
    name,
    licenseExpiry: expiry,
    status: "On Duty"
  });

  loadDrivers();
};

window.suspendDriver = async function (id) {
  await updateDoc(doc(db, "drivers", id), {
    status: "Suspended"
  });

  loadDrivers();
};
window.loadTrips = async function () {
  const vehiclesSnap = await getDocs(collection(db, "vehicles"));
  const driversSnap = await getDocs(collection(db, "drivers"));
  const tripsSnap = await getDocs(collection(db, "trips"));

  let vehicleOptions = "";
  vehiclesSnap.forEach(docSnap => {
    const v = docSnap.data();
    if (v.status === "Available") {
      vehicleOptions += `<option value="${docSnap.id}|${v.capacity}">${v.name} (${v.capacity}kg)</option>`;
    }
  });

  let driverOptions = "";
  const today = new Date();

  driversSnap.forEach(docSnap => {
    const d = docSnap.data();
    const expiry = new Date(d.licenseExpiry);

    if (d.status === "On Duty" && expiry >= today) {
      driverOptions += `<option value="${docSnap.id}">${d.name}</option>`;
    }
  });

  let html = `
    <h2>Trip Dispatcher</h2>

    <div class="form-row">
      <select id="tripVehicle">${vehicleOptions}</select>
      <select id="tripDriver">${driverOptions}</select>
      <input id="cargoWeight" type="number" placeholder="Cargo Weight (kg)">
      <button onclick="createTrip()">Dispatch</button>
    </div>

    <h3>Active Trips</h3>
    <table class="data-table">
      <tr>
        <th>Vehicle</th>
        <th>Driver</th>
        <th>Cargo</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
  `;

  tripsSnap.forEach(docSnap => {
    const t = docSnap.data();
    html += `
      <tr>
        <td>${t.vehicleName}</td>
        <td>${t.driverName}</td>
        <td>${t.cargoWeight}kg</td>
        <td>${t.status}</td>
        <td>
          ${t.status === "Dispatched"
            ? `<button onclick="completeTrip('${docSnap.id}', '${t.vehicleId}', '${t.driverId}')">Complete</button>`
            : "—"
          }
        </td>
      </tr>
    `;
  });

  html += `</table>`;

  document.getElementById("contentArea").innerHTML = html;
};
window.createTrip = async function () {

  const vehicleSelect = document.getElementById("tripVehicle");
  const driverSelect = document.getElementById("tripDriver");

  if (!vehicleSelect.value) {
    alert("Select a vehicle");
    return;
  }

  if (!driverSelect.value) {
    alert("No eligible driver available 🚨");
    return;
  }

  const vehicleData = vehicleSelect.value.split("|");
  const vehicleId = vehicleData[0];
  const vehicleCapacity = Number(vehicleData[1]);

  const driverId = driverSelect.value;
  const cargoWeight = Number(document.getElementById("cargoWeight").value);

  if (!cargoWeight) {
    alert("Enter cargo weight");
    return;
  }

  if (cargoWeight > vehicleCapacity) {
    alert("Cargo exceeds vehicle capacity 🚨");
    return;
  }

  const vehicleDoc = await getDocs(collection(db, "vehicles"));
  const driverDoc = await getDocs(collection(db, "drivers"));

  let vehicleName = "";
  let driverName = "";

  vehicleDoc.forEach(d => {
    if (d.id === vehicleId) vehicleName = d.data().name;
  });

  driverDoc.forEach(d => {
    if (d.id === driverId) driverName = d.data().name;
  });

  await addDoc(collection(db, "trips"), {
    vehicleId,
    vehicleName,
    driverId,
    driverName,
    cargoWeight,
    status: "Dispatched"
  });

  await updateDoc(doc(db, "vehicles", vehicleId), {
    status: "On Trip"
  });

  await updateDoc(doc(db, "drivers", driverId), {
    status: "Off Duty"
  });

  alert("Trip Dispatched 🚛");

  loadTrips();
};
window.completeTrip = async function (tripId, vehicleId, driverId) {

  if (!driverId) {
    alert("Invalid trip data 🚨");
    return;
  }

  await updateDoc(doc(db, "trips", tripId), {
    status: "Completed"
  });

  await updateDoc(doc(db, "vehicles", vehicleId), {
    status: "Available"
  });

  await updateDoc(doc(db, "drivers", driverId), {
    status: "On Duty"
  });

  loadTrips();
};
window.loadMaintenance = async function () {

  const vehicleSnap = await getDocs(collection(db, "vehicles"));
  const maintenanceSnap = await getDocs(collection(db, "maintenance"));

  let vehicleOptions = "";

  vehicleSnap.forEach(docSnap => {
    const v = docSnap.data();

    // Only vehicles not retired
    if (v.status !== "Retired") {
      vehicleOptions += `<option value="${docSnap.id}">${v.name}</option>`;
    }
  });

  let html = `
    <h2>Maintenance Logs</h2>

    <div class="form-row">
      <select id="maintVehicle">${vehicleOptions}</select>
      <input id="maintType" placeholder="Maintenance Type (Oil, Engine, etc)">
      <input id="maintCost" type="number" placeholder="Cost">
      <button onclick="addMaintenance()">Add</button>
    </div>

    <table class="data-table">
      <tr>
        <th>Vehicle</th>
        <th>Type</th>
        <th>Cost</th>
        <th>Date</th>
        <th>Action</th>
      </tr>
  `;
maintenanceSnap.forEach(docSnap => {
  const m = docSnap.data();

  html += `
    <tr>
      <td>${m.vehicleName}</td>
      <td>${m.type}</td>
      <td>₹${m.cost}</td>
      <td>${m.date}</td>
      <td>
        <button onclick="completeService('${m.vehicleId}')">
          Mark Done
        </button>
      </td>
    </tr>
  `;
});
  

  html += `</table>`;

  document.getElementById("contentArea").innerHTML = html;
};
window.completeService = async function(vehicleId) {

  await updateDoc(doc(db, "vehicles", vehicleId), {
    status: "Available"
  });

  alert("Vehicle Back In Service 🚛");

  loadMaintenance();
};
window.addMaintenance = async function () {

  const vehicleId = document.getElementById("maintVehicle").value;
  const type = document.getElementById("maintType").value;
  const cost = Number(document.getElementById("maintCost").value);

  if (!vehicleId || !type || !cost) {
    alert("Fill all fields");
    return;
  }

  const vehicleSnap = await getDocs(collection(db, "vehicles"));
  let vehicleName = "";

  vehicleSnap.forEach(docSnap => {
    if (docSnap.id === vehicleId) {
      vehicleName = docSnap.data().name;
    }
  });

  const today = new Date().toISOString().split("T")[0];

  await addDoc(collection(db, "maintenance"), {
    vehicleId,
    vehicleName,
    type,
    cost,
    date: today
  });

  // 🔥 AUTO SET VEHICLE TO IN SHOP
  await updateDoc(doc(db, "vehicles", vehicleId), {
    status: "In Shop"
  });

  alert("Maintenance Logged 🔧");

  loadMaintenance();
};
window.loadFuel = async function () {

  const vehicleSnap = await getDocs(collection(db, "vehicles"));
  const fuelSnap = await getDocs(collection(db, "fuelLogs"));

  let vehicleOptions = "";

  vehicleSnap.forEach(docSnap => {
    vehicleOptions += `<option value="${docSnap.id}">${docSnap.data().name}</option>`;
  });

  let html = `
    <h2>Fuel Logs</h2>

    <div class="form-row">
      <select id="fuelVehicle">${vehicleOptions}</select>
      <input id="fuelLiters" type="number" placeholder="Liters">
      <input id="fuelCost" type="number" placeholder="Cost">
      <button onclick="addFuel()">Add</button>
    </div>

    <table class="data-table">
      <tr>
        <th>Vehicle</th>
        <th>Liters</th>
        <th>Cost</th>
      </tr>
  `;

  fuelSnap.forEach(docSnap => {
    const f = docSnap.data();

    html += `
      <tr>
        <td>${f.vehicleName}</td>
        <td>${f.liters}</td>
        <td>₹${f.cost}</td>
      </tr>
    `;
  });

  html += `</table>`;

  document.getElementById("contentArea").innerHTML = html;
};
window.addFuel = async function () {

  const vehicleId = document.getElementById("fuelVehicle").value;
  const liters = Number(document.getElementById("fuelLiters").value);
  const cost = Number(document.getElementById("fuelCost").value);

  if (!vehicleId || !liters || !cost) {
    alert("Fill all fields");
    return;
  }

  const vehicleSnap = await getDocs(collection(db, "vehicles"));
  let vehicleName = "";

  vehicleSnap.forEach(docSnap => {
    if (docSnap.id === vehicleId) {
      vehicleName = docSnap.data().name;
    }
  });

  await addDoc(collection(db, "fuelLogs"), {
    vehicleId,
    vehicleName,
    liters,
    cost
  });

  alert("Fuel Logged ⛽");

  loadFuel();
};