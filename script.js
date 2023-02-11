'use strict';



class Workout {
  id = Date.now() + ''.slice(-10);
  date = new Date();

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescribtion(){
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
//    console.log( this.type)
    this.describtion = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
 }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadance) {
    super(distance, duration, coords);
    this.cadance = cadance;
    this.calcPace();
    this._setDescribtion()
  }

  calcPace() {
    //min / km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescribtion()
  }

  calcSpeed() {
    //km / h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running(5, 30, [41, 69], 178);
const cycling1 = new Cycling(10, 80, [41, 69], 24);

const form = document.querySelector('.form');
const logo = document.querySelector('.logo')
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 3;

  constructor() {
    // Get user's positon
    this._getPosition();

    //Get data from local storage
    this._getLocalStorage()

    // Attach

    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
    logo.addEventListener('click', this.reset)
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your location');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => {
        this._renderWorkoutMarker(workout)

    
       })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm(){
    //Empty inputs
    inputDistance.value = inputCadence.value = inputDistance.value = '';
    form.style.display = 'none'
    form.classList.add('hidden')
    setTimeout(() => {
        form.style.display = 'grid'
    }, 1000);
    
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    // If workout type is running, create running object
    if (type === 'running') {
      const cadance = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadance) ||
        !allPositive(distance, duration, cadance)
      )
        return alert('Inputs have to be positive number');

      workout = new Running(distance, duration, [lat, lng], cadance);
    }

    // If workout type is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive number');

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + Clear input fields
    this._hideForm()

    // Set local storage to all workouts
    this._setLocalStorage()
  }

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
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.describtion}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.describtion} </h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

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
            </li>
            `;
    }

    if (workout.type === 'cycling') {
      html += `

        <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(2)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain} </span>
                <span class="workout__unit">m</span>
            </div>
            </li> 
      
      `;
    }


    form.insertAdjacentHTML('afterend', html )
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout')

    if(!workoutEl) return;
    
    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
        animate: true,
        pan: {
            duration: 1
        }
    })
  }

  _setLocalStorage(){
    localStorage.setItem('ketmon', JSON.stringify(this.#workouts))
  }

  _getLocalStorage(){
   const data = JSON.parse(localStorage.getItem('ketmon'))
   if(!data) return

   this.#workouts = data
   this.#workouts.forEach(workout => {
    this._renderWorkout(workout)

   })
  }

  reset(){
    localStorage.removeItem('ketmon')
    location.reload()
  }
}

const app = new App();

// app.reset()
