const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; //{lat,lng}
    this.distance = distance; // km/h
    this.duration = duration; // min/km
  }
  _setDescription() {
    // prettier-ignore

    const months = [ 'January','February','March',  'April','May','June', 'July','August','September','October','November','December',
];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

//running class
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

//cycling class
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// =========================//
//Application architecture
class App {
  #map;
  #mapEvent;
  #workout = [];
  #mapZoomLevel = 13;
  constructor() {
    this._getLocalStorage();

    //fetching user location
    this._getPosition();

    //Event listners
    form.addEventListener('submit', this._newWorkouts.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  //fetching user location
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),

      function () {
        alert('Unable to load your current position');
      }
    );
  }

  //loading map
  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    console.log(`https://www.google.com/maps/@${latitude},${longitude},13z`);

    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    //rendering marker on load
    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  //form show on click
  _showForm(mapEv) {
    form.classList.remove('hidden');
    this.#mapEvent = mapEv;
    inputDistance.focus();
  }

  //hiding form after submitting
  _hideForm() {
    //clear all input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  //cadence and elevation field toggle
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //rendering new workouts
  _newWorkouts(e) {
    e.preventDefault();

    const validinputs = (...inputs) =>
      inputs.every(inp => inp > Number.isFinite(inp));

    const checkPositiveNO = (...inputs) => inputs.every(inp => inp > 0);

    //get data from form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === 'running') {
      const cadance = +inputCadence.value;

      //Check  data validity
      if (
        !validinputs(distance, duration, cadance) ||
        !checkPositiveNO(distance, duration, cadance)
      )
        return alert('all input field must be positive number ');

      //  create ruuning object
      workout = new Running([lat, lng], distance, duration, cadance);
    }

    //if workout cycling create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validinputs(distance, duration, elevation) ||
        !checkPositiveNO(distance, duration)
      )
        return alert('all input field must be positive number ');

      //  create Cycling object
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //push obj in workout array

    this.#workout.push(workout);

    // render workout on map
    this._renderWorkoutMarker(workout);

    // render workout on list
    this._renderWorkoutList(workout);

    // hide form
    this._hideForm();

    // setting local storage
    this._setLocalStorage();
  }

  //redering marker on map
  _renderWorkoutMarker(workout) {
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
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.discription}`
      )
      .openPopup();
  }

  //rendering workouts
  _renderWorkoutList(workout) {
    let html = `
        <li class="workout workout--${workout.type}"data-id="${workout.id}">
          <h2 class="workout__title">${workout.discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadance}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  // on click moving to popup location
  _moveToPopup(e) {
    const workoutEL = e.target.closest('.workout');
    if (!workoutEL) return;
    const workout = this.#workout.find(
      work => work.id === workoutEL.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // setting local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }

  // getting data from local storage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workout = data;

    // rendering workout on list
    this.#workout.forEach(work => {
      this._renderWorkoutList(work);
    });
  }

  //  resetting local storage
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
