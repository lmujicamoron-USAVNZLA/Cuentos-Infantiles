// Simulación de Base de Datos y API para Story Creator Kids
// Este módulo maneja la persistencia de datos (Usuarios y Cuentos) con blindaje contra errores de seguridad local

const DB = {
    // LLaves para localStorage
    USERS_KEY: 'sck_users',
    STORIES_KEY: 'sck_stories',

    // Auxiliar para acceso seguro a localStorage
    safeGet: function(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("⚠️ Acceso a localStorage bloqueado por seguridad del navegador.");
            return null;
        }
    },

    safeSet: function(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn("⚠️ No se pudo guardar en localStorage: permiso denegado.");
            return false;
        }
    },

    // --- MANEJO DE USUARIOS ---

    saveUser: function (userData) {
        const users = this.getAllUsers();
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            status: 'pendiente',
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        this.safeSet(this.USERS_KEY, JSON.stringify(users));
        return newUser;
    },

    getAllUsers: function () {
        const users = this.safeGet(this.USERS_KEY);
        try {
            return users ? JSON.parse(users) : [];
        } catch (e) { return []; }
    },

    approveUser: function (userId) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].status = 'aprobado';
            return this.safeSet(this.USERS_KEY, JSON.stringify(users));
        }
        return false;
    },

    deleteUser: function (userId) {
        const users = this.getAllUsers();
        const filtered = users.filter(u => u.id !== userId);
        this.safeSet(this.USERS_KEY, JSON.stringify(filtered));
    },

    // --- MANEJO DE CUENTOS ---

    saveStory: function (storyData) {
        const stories = this.getAllStories();
        
        const newStory = {
            id: storyData.id || 'local_' + Date.now().toString(),
            ...storyData,
            source: storyData.id ? 'firebase' : 'local',
            createdAt: storyData.createdAt || new Date().toISOString()
        };

        const exists = stories.find(s => s.id === newStory.id || (s.title === newStory.title && s.userId === newStory.userId));
        if (!exists) {
            stories.push(newStory);
            this.safeSet(this.STORIES_KEY, JSON.stringify(stories));
        }
        return newStory;
    },

    getAllStories: function () {
        const stories = this.safeGet(this.STORIES_KEY);
        try {
            return stories ? JSON.parse(stories) : [];
        } catch (e) {
            return [];
        }
    },

    deleteStory: function (storyId) {
        const stories = this.getAllStories();
        const filtered = stories.filter(s => s.id !== storyId);
        return this.safeSet(this.STORIES_KEY, JSON.stringify(filtered));
    }
};

// Exportar para uso global
window.StoryDB = DB;
