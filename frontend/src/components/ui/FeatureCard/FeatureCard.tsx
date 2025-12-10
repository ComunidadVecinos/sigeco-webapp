//Tarjeta reutilizable para caracteriticas de la landingPage

import React from 'react';
import logo from '../../../assets/images/1.png';

interface FeatureCardProps {
    title: string;
    subtitle: string;
    description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({title, subtitle, description}) =>{
    return (
        <div className="card text-center">
            <h3 className="mt-4">
                <strong>{title}</strong>
            </h3>
            <img className="card-img-top" src={logo} alt="{`Icono de ${title}`}"/>
            <div className="card-body">
                <h4>
                    <strong>{subtitle}</strong>
                </h4>
                <p className="card-text">{description}</p>
            </div>
        </div>
    );
};

export default FeatureCard;