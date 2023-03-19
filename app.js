'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map;
let mapEvent;

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];

  //////////////////////////////////////////////////////////////////////////////////////
  // Load Page
  //////////////////////////////////////////////////////////////////////////////////////
  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    //Attach event handlers
    /************ 3.b Submit the form ***********/
    form.addEventListener('submit', this._newWorkOut.bind(this));
    /************* 4. Change Input ************/
    inputType.addEventListener('change', this._toggleElevationFields);

    /********************/
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // get current position
  //////////////////////////////////////////////////////////////////////////////////////
  _getPosition() {
    /************ 1. Geo-location API *********************/
    // If condition - is for the old browser compatibility
    // so that no error occurs if navigator.geolocation is not found.
    if (navigator.geolocation) {
      // Geo-location API
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your current location');
        }
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Recieve position
  //////////////////////////////////////////////////////////////////////////////////////
  _loadMap(position) {
    //console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    //console.log(latitude, longitude);
    //console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    /*********** 2.b. Display map marker in the map ************/
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // changing style and theme of the map using .fr/hot instead of .org
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    /******** 3.a Display or render the form when user clicks on map **********/

    // map.on function simillar to addEventListner created by leaflet
    this.#map.on('click', this._showForm.bind(this));

    // Render Workout from local storage after map load
    this.#workouts.forEach(work => this._renderWorkOutMarker(work));
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Click on the Map
  //////////////////////////////////////////////////////////////////////////////////////
  _showForm(mapE) {
    this.#mapEvent = mapE;
    // display or render the form as soon as user clicks on the map
    form.classList.remove('hidden');
    inputDistance.focus(); // focus the input element distance for use input

    /**************** 3.b. Submit the form **********************************/
    // Add event listener function
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Hide Form
  //////////////////////////////////////////////////////////////////////////////////////
  _hideForm() {
    //clear the form
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    // Hide the form
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Change Input
  //////////////////////////////////////////////////////////////////////////////////////
  _toggleElevationFields() {
    // Any of (cadence or elevation) should be visible at a time hence using toggle
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Submit form
  //////////////////////////////////////////////////////////////////////////////////////
  _newWorkOut(e) {
    // Helper function to do data validation - finite number
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    // Helper function to do data validation - positive number
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    e.preventDefault();
    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value; // '+' to convert string to number
    const duration = +inputDuration.value; // '+' to convert string to number
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If Workout running, create a running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      //if(!Number.isFinite(distance) ||!Number.isFinite(duration) ||!Number.isFinite(cadence))
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive number');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If Workout cycling, create a cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration) // Elevation can be negative so no check
      )
        return alert('Inputs have to be positive number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add the new object to Workout array
    this.#workouts.push(workout);
    //console.log(workout);

    // Render workout on map as marker
    this._renderWorkOutMarker(workout);

    // Render workout on the list
    this._renderWorkOut(workout);

    // Hide the form and clear input fields
    this._hideForm();

    // Set loacal storage
    this._setLocalStorage();
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Render Workout Marker
  //////////////////////////////////////////////////////////////////////////////////////
  _renderWorkOutMarker(workout) {
    // console.log(this.#mapEvent);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Render Workout form
  //////////////////////////////////////////////////////////////////////////////////////
  _renderWorkOut(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
        </div>`;

    if (workout.type === 'running')
      html += `
           <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>`;

    if (workout.type === 'cycling')
      html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🚵</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
        </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Move to popup when user clicks on Workout list
  //////////////////////////////////////////////////////////////////////////////////////
  _moveToPopup(e) {
    const workOutEl = e.target.closest('.workout');

    if (!workOutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workOutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // Using public interface
    // workout.click();
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Local Storage API
  //////////////////////////////////////////////////////////////////////////////////////
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workouts = data;

    this.#workouts.forEach(work => this._renderWorkOut(work));
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // Reset Local Storage
  //////////////////////////////////////////////////////////////////////////////////////
  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
