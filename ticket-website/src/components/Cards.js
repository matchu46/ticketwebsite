import React from 'react';
import CardItem from './CardItem';
import './Cards.css';

function Cards() {
  return (
    <div className='cards'>
      <h1>Check out Arizona sports!</h1>
      <div class="cards__container">
        <div class="cards__wrapper">
          <ul class="cards__items">
            <CardItem 
            src="images/phoenix_suns_upper.jpg"
            text="Feel the heat, catch the Suns live!"
            label='Basketball'
            path='/suns'
            />
            <CardItem 
            src="images/chasefield-2021-4.jpg"
            text="Step up to the plate!"
            label='Baseball'
            path='/dbacks'
            />
          </ul>
          <ul class="cards__items">
            <CardItem 
            src="images/statefarm-stadium.jpg"
            text="Nothing beats Game day."
            label='Football'
            path='/tickets'
            />
            <CardItem 
            src="images/suns_event.webp"
            text="Head to Footprint Center!"
            label='Basketball'
            path='/suns'
            />
            <CardItem 
            src="images/booker-shot.jpg"
            text="Book your tickets today!"
            label='Basketball'
            path='/suns'
            />
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Cards;
