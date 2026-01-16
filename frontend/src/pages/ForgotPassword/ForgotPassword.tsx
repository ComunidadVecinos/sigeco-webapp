import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import logo from '../../assets/images/6.png';

const ForgotPassword: React.FC = () => {
    const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('');

    const handleMetodoChange = (metodo: string) => {
        setMetodoSeleccionado(metodo);
    };

    return (
        <div>
            <header>
                <nav className="navbar bg-white">
                    <div className="container-fluid">
                        <Link to="/" className="navbar-brand">
                            <img src={logo} alt="Sigeco" className="img-logo1" />
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="container">
                <h1 className="text-center"><strong>Olvidé mi contraseña</strong></h1>
                <hr className="mx-auto w-26 hr-grueso" />
                <div className=" row d-flex justify-content-center mt-3">
                    <h4 className="sub-title text-center mb-5">Introduce tu email y te enviaremos una nueva contraseña temporal con la que acceder. <br />Recomendamos que cambies la contraseña una vez que hayas podido acceder desde tu perfil </h4>
                    <div className="row">
                        <div className="formulario mb-3 mt-2">
                            <label htmlFor="" className='form-label'>Introduce email</label> <br />
                            <input type="text" className='form-control' id='email' placeholder='correo@ucm.es'/>
                        </div>
                    </div>
                    <div className='row mt-4 justify-content-center'>
                        <button className='btn btn-light btn-sm btn-forgot'>Enviar</button>
                    </div>
                </div>
            </main>

            <footer className='register-footer'>
                <div className='mt-3'>
                    Si tienes un código pero todavía no te has registrado, <Link to="/registro">hazlo aquí</Link>
                </div>
            </footer>
        </div>
    );
};

export default ForgotPassword;