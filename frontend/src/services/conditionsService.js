import api from './api';

const conditionsService = {
    getAll: async (params) => {
        const response = await api.get('/conditions', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/conditions/${id}`);
        return response.data;
    },
    search: async (params) => {
        const response = await api.get('/conditions/search', { params });
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/conditions', data);
        return response.data;
    },

    createWithImages: async (data, files) => {
        const formData = new FormData();
        formData.append('conditions', JSON.stringify(data));
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
        }
        const response = await api.post('/conditions/multipart', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/conditions/${id}`);
        return response.data;
    },

    getPending: async (params) => {
        const response = await api.get('/conditions/pending', { params });
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/conditions/${id}`, data);
        return response.data;
    },

    validate: async (id) => {
        const response = await api.post(`/conditions/${id}/validate`);
        return response.data;
    },

    exportData: async (params, format) => {
        const response = await api.get('/conditions/export', { 
            params: { ...params, format },
            responseType: 'blob'
        });
        return response.data;
    }
};

export default conditionsService;
