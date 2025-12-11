//Tarjeta reutilizable para caracteriticas de la landingPage

import React from 'react';

interface FeatureCardProps {
    title: string;
    subtitle: string;
    description: string;
    icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({title, subtitle, description, icon}) =>{
    return (
        <div className="feature-card">
            <div className="feature-card-header">
                <img className="feature-card-icon" src={icon} alt={`Icono de ${title}`}/>
                <h3><strong>{title}</strong></h3>
            </div>
            <div className="feature-card-body">
                <h4><strong>{subtitle}</strong></h4>
                <p>{description}</p>
            </div>
        </div>
    );
};

export default FeatureCard;