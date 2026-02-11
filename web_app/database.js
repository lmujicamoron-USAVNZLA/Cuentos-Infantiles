// Simulación de Base de Datos y API para Story Creator Kids
// Este módulo maneja la persistencia de datos (Usuarios y Cuentos)

const DB = {
    // LLaves para localStorage
    USERS_KEY: 'sck_users',
    STORIES_KEY: 'sck_stories',

    // --- MANEJO DE USUARIOS ---

    // Guardar nuevo usuario (Pendiente de aprobación)
    saveUser: function (userData) {
        const users = this.getAllUsers();
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            status: 'pendiente',
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return newUser;
    },

    // Obtener todos los usuarios
    getAllUsers: function () {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    // Aprobar usuario
    approveUser: function (userId) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].status = 'aprobado';
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            return true;
        }
        return false;
    },

    // Eliminar/Rechazar usuario
    deleteUser: function (userId) {
        const users = this.getAllUsers();
        const filtered = users.filter(u => u.id !== userId);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users.length > filtered.length ? this.USERS_KEY : filtered));
        localStorage.setItem(this.USERS_KEY, JSON.stringify(filtered));
    },

    // --- MANEJO DE CUENTOS ---

    saveStory: function (storyData) {
        const stories = this.getAllStories();
        const newStory = {
            id: Date.now().toString(),
            ...storyData,
            createdAt: new Date().toISOString()
        };
        stories.push(newStory);
        localStorage.setItem(this.STORIES_KEY, JSON.stringify(stories));
        return newStory;
    },

    getAllStories: function () {
        const stories = localStorage.getItem(this.STORIES_KEY);
        return stories ? JSON.parse(stories) : [];
    }
};

// Exportar para uso global
window.StoryDB = DB;
