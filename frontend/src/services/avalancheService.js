import api from './api';

const avalancheService = {
    getAll: async (params) => {
        const response = await api.get('/avalanches', { params });
        return response.data;
    },

    getValidated: async (params) => {
        const response = await api.get('/avalanches/validated', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/avalanches/${id}`);
        return response.data;
    },
    search: async (params) => {
        const response = await api.get('/avalanches/search', { params });
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/avalanches', data);
        return response.data;
    },
    
    createWithImages: async (avalancheData, files) => {
        const formData = new FormData();
        // Append JSON as a blob part so Spring identifies it correctly as RequestPart
        formData.append('avalanche', JSON.stringify(avalancheData));
        
        if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });
        }
        
        const response = await api.post('/avalanches/multipart', formData);
        return response.data;
    },

    uploadImages: async (id, files) => {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append('files', file);
        });
        
        const response = await api.post(`/avalanches/${id}/images`, formData);
        return response.data;
    },

    validate: async (id) => {
        const response = await api.put(`/avalanches/${id}/validate`);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/avalanches/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/avalanches/${id}`);
        return response.data;
    },

    deleteImage: async (id, imageUrl) => {
        const response = await api.delete(`/avalanches/${id}/images`, { params: { imageUrl } });
        return response.data;
    },

    exportData: async (params, format) => {
        const response = await api.get('/avalanches/export', { 
            params: { ...params, format },
            responseType: 'blob'
        });
        return response.data;
    },

    syncOne: async (id) => {
        const response = await api.post(`/admin/sync/avalanches/${id}`);
        return response.data;
    },

    syncAll: async () => {
        const response = await api.post('/admin/sync/avalanches');
        return response.data;
    }
};

export default avalancheService;
