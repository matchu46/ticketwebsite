import React from 'react';
import CardItem from './CardItem';
import './Cards.css';

function Cards() {
  return (
    <div className='cards'>
      <h1>Check out the ballpark!</h1>
      <div class="cards__container">
        <div class="cards__wrapper">
          <ul class="cards__items">
            <CardItem 
            src="images/phoenix_suns_upper.jpg"
            text="Head to Footprint Center to Catch a Suns game"
            label='Basketball'
            path='/tickets'
            />
            <CardItem 
            src="images/img-2.jpg"
            text="Travel through the Islands of Bali in a Private Cruise"
            label='Luxury'
            path='/explore'
            />
          </ul>
          <ul class="cards__items">
            <CardItem 
            src="images/img-3.jpg"
            text="Set Sail in the Atlantic Ocean visiting Uncharted Waters"
            label='Mystery'
            path='/explore'
            />
            <CardItem 
            src="images/img-4.jpg"
            text="Experience Football on Top of the Himilayan Mountains"
            label='Adventure'
            path='/tickets'
            />
            <CardItem 
            src="images/img-8.jpg"
            text="Ride through the Sahara Desert on a guided Camel Tour"
            label='Adrenaline'
            path='/sign-up'
            />
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Cards;
