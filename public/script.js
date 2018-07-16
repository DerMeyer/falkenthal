(function() {

    Vue.component('folders', {
        template: '#folders'
    });

    Vue.component('login', {
        data: function() {
            return {
                message: 'Hi Jens!',
                pw: ''
            }
        },
        methods: {
            login: function(event) {
                if (event.type !== 'click' && event.keyCode !== 13) {
                    return;
                }
                const app = this;
                axios.post('/login', { pw: this.pw }).then(function(resp) {
                    if (resp.data.success) {
                        window.location.replace('/');
                    } else {
                        app.message = 'Falsches Passwort .';
                    }
                }).catch(function(err) {
                    console.log(err);
                    app.message = 'Der Server antwortet nicht .';
                });
            },
        },
        template: '#login'
    });

    const app = new Vue({
        el: '#app',
        data: {
            message: 'Hi Jens!',
            admin: false,
            home: window.location.pathname === '/' ? true : false
        },
        mounted: function() {
            const app = this;
            axios.get('/admin').then(function(resp) {
                app.admin = resp.data.admin;
            }).catch(function(err) {
                console.log(err);
            });
        },
        methods: {
            logout: function() {
                const app = this;
                axios.get('/logout').then(function(resp) {
                    if (resp.data.success) {
                        app.admin = false;
                    } else {
                        app.message = 'Da ist was schiefgelaufen .';
                    }
                }).catch(function(err) {
                    console.log(err);
                    app.message = 'Der Server antwortet nicht .';
                });
            }
        }
    });

})();
