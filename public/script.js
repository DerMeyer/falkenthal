(function() {

    // components

    const projects = Vue.extend({
        template: '#projects',
        props: [ 'admin' ],
        data: function() {
            return {
                message: 'Hier kannst du einen neuen Bilderordner erstellen .',
                confirm: false,
                name: '',
                description: '',
                newname: '',
                folders: []
            }
        },
        methods: {
            createfolder: function(event) {
                if (event.type !== 'click' && event.keyCode !== 13) {
                    return;
                }
                const app = this;
                axios
                    .post('/create_folder', {
                        position: this.folders.reduce(function(a, v) { return a > v.position ? a : v.position + 1 }, 0),
                        name: this.name,
                        description: this.description
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.getfolders();
                            app.message = app.name + ' wurde hinzugefügt .';
                            const appNxt = app;
                            setTimeout(function() {
                                appNxt.message = 'Hier kannst du einen neuen Bilderordner erstellen .';
                            }, 2000);
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            renamefolder: function(event) {
                if (event.keyCode !== 13) {
                    return;
                }
                const app = this;
                axios
                    .post('/rename_folder', {
                        id: event.target.id.slice(-1),
                        name: this.newname
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.getfolders();
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            confirmdelete: function() {
                this.confirm = true;
            },
            canceldelete: function() {
                this.confirm = false;
            },
            deletefolder: function(event) {
                const app = this;
                axios
                    .post('/delete_folder', {
                        id: event.target.id.slice(7)
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.canceldelete();
                            app.getfolders();
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            prevposition: function(event) {
                const foldersToSwap = this.folders.filter(function(v, i, a) { return v.id == event.target.id.slice(4) || (a[i + 1] && a[i + 1].id == event.target.id.slice(4)) });
                if (foldersToSwap.length < 2) {
                    return;
                } else {
                    this.swapfolders(foldersToSwap);
                }
            },
            nextposition: function(event) {
                const foldersToSwap = this.folders.filter(function(v, i, a) { return v.id == event.target.id.slice(4) || (a[i - 1] && a[i - 1].id == event.target.id.slice(4)) });
                if (foldersToSwap.length < 2) {
                    return;
                } else {
                    this.swapfolders(foldersToSwap);
                }
            },
            swapfolders: function(foldersToSwap) {
                const app = this;
                axios
                    .post('/swap_folders', {
                        id_one: foldersToSwap[0].id,
                        position_one: foldersToSwap[0].position,
                        id_two: foldersToSwap[1].id,
                        position_two: foldersToSwap[1].position
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.getfolders();
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            getfolders: function() {
                const app = this;
                axios
                    .get('/get_folders')
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.folders = resp.data.folders;
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            }
        },
        mounted: function() {
            this.getfolders();
        }
    });

    const folder = Vue.extend({
        template: '#folder'
    });

    const contact = Vue.extend({
        template: '#contact'
    });

    const about = Vue.extend({
        template: '#about'
    });

    const login = Vue.extend({
        template: '#login',
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
                axios
                    .post('/login', { pw: this.pw })
                    .then(function(resp) {
                        if (resp.data.success) {
                            window.location.replace('/');
                        } else {
                            app.message = 'Falsches Passwort .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            }
        }
    });

    // app

    const router = new VueRouter({
        routes: [
            { path: '/projects', component: projects },
            { path: '/folder/:id', component: folder },
            { path: '/contact', component: contact },
            { path: '/about', component: about },
            { path: '/ichbinjens', component: login }
        ]
    });

    const app = new Vue({
        router: router,
        el: '#app',
        data: {
            message: 'Hi Jens!',
            admin: false
        },
        methods: {
            logout: function() {
                const app = this;
                axios
                    .get('/logout')
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.admin = false;
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            }
        },
        mounted: function() {
            this.$router.push('/projects');
            const app = this;
            axios
                .get('/admin')
                .then(function(resp) {
                    app.admin = resp.data.admin;
                })
                .catch(function(err) {
                    console.log(err);
                });
        }
    });

})();
