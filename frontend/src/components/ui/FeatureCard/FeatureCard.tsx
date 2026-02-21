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
        <div className="bg-white rounded-2xl p-6 w-[340px] min-h-[180px] shadow-md border-2 border-[#104084] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl lg:max-w-[400px]">
            <div className="flex items-center gap-4 mb-4">
                <img className="w-12 h-12 object-contain" src={icon} alt={`Icono de ${title}`}/>
                <h3 className='text-[#104084] text-xl font-bold'>{title}</h3>
            </div>
            <div>
                <h4 className='text-sm font-bold text-gray-600 mb-2'>{subtitle}</h4>
                <p className='text-sm text-gray-500'>{description}</p>
            </div>
        </div>
    );
};

export default FeatureCard;