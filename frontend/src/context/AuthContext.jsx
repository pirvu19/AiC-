import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/signin', { email, password });
        const data = response.data;
        if (data.accessToken || data.token) {
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
        }
        return data;
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    const register = (username, email, password, role) => {
        return api.post('/auth/signup', {
            username,
            email,
            password,
            role
        });
    };

    const isAdmin = user?.roles?.some(role => role === 'ROLE_ADMIN' || role === 'ADMIN');
    const isExpert = user?.roles?.some(role => role === 'ROLE_EXPERT' || role === 'EXPERT') || isAdmin;
    const isUserAdmin = user?.roles?.some(role => role === 'ROLE_ADMIN_UTILIZATORI' || role === 'ADMIN_UTILIZATORI') || isAdmin;
    const isReviewer = user?.roles?.some(role => role === 'ROLE_REVIEWER' || role === 'REVIEWER') || isAdmin;
    const isDataEngineer = user?.roles?.some(role => role === 'ROLE_DATA_ENGINEER' || role === 'DATA_ENGINEER') || isAdmin;
    const mustChangePassword = user?.mustChangePassword;

    return (
        <AuthContext.Provider value={{ user, login, logout, register, isAdmin, isExpert, isUserAdmin, isReviewer, isDataEngineer, mustChangePassword, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
