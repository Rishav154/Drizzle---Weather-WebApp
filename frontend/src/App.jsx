import React from 'react';
import backgroundImage from './assets/background.jpg';
import Weather from './components/Weather.jsx'

const App = () => {
    return (
        <>
            <div
                className="background-container min-h-screen w-full bg-cover bg-no-repeat flex items-center justify-center"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                }}
            >
                <Weather/>
            </div>
        </>
    );
};

export default App;
