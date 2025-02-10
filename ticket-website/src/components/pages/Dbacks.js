import React, {useState, useEffect} from "react";
import {useNavigate} from 'react-router-dom';
import './Dbacks.css';
import '../../App.css';
import Footer from '../Footer';

export default function Dbacks() {
    const [groupedTickets, setGroupedTickets] = useState({});
    const navigate = useNavigate();

    useEffects(() => {
        fetch('http://localhost:5000/tickets')
    })
}