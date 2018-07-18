(function() {

    // projects component

    const Projects = Vue.extend({
        template: '#projects-template',
        props: {
            admin: Boolean
        },
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
            $_projects_createfolder: function(event) {
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
                            app.$_projects_getfolders();
                            app.message = app.name + ' wurde hinzugefügt .';
                            app.name = '';
                            app.description = '';
                            const appNxt = app;
                            window.setTimeout(function() {
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
            $_projects_renamefolder: function(event) {
                if (event.keyCode !== 13) {
                    return;
                }
                const app = this;
                axios
                    .post('/rename_folder', {
                        id: event.target.id.slice(7),
                        name: this.newname
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.$_projects_getfolders();
                            app.newname = '';
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            $_projects_confirmdelete: function() {
                this.confirm = true;
            },
            $_projects_canceldelete: function() {
                this.confirm = false;
            },
            $_projects_deletefolder: function(event) {
                const app = this;
                axios
                    .post('/delete_folder', {
                        id: event.target.id.slice(7)
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.$_projects_canceldelete();
                            app.$_projects_getfolders();
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            $_projects_prevposition: function(event) {
                const foldersToSwap = this.folders.filter(function(v, i, a) { return v.id == event.target.id.slice(4) || (a[i + 1] && a[i + 1].id == event.target.id.slice(4)) });
                if (foldersToSwap.length < 2) {
                    return;
                } else {
                    this.$_projects_swapfolders(foldersToSwap);
                }
            },
            $_projects_nextposition: function(event) {
                const foldersToSwap = this.folders.filter(function(v, i, a) { return v.id == event.target.id.slice(4) || (a[i - 1] && a[i - 1].id == event.target.id.slice(4)) });
                if (foldersToSwap.length < 2) {
                    return;
                } else {
                    this.$_projects_swapfolders(foldersToSwap);
                }
            },
            $_projects_swapfolders: function(foldersToSwap) {
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
                            app.$_projects_getfolders();
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            $_projects_getfolders: function() {
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
            this.$_projects_getfolders();
        }
    });

    // images component

    const Images = Vue.extend({
        template: '#images-template',
        props: {
            admin: Boolean
        },
        data: function() {
            return {
                message: 'Hier kannst du ein neues Bild hochladen .',
                confirm: false,
                description: '',
                newfolder: '',
                images: []
            }
        },
        methods: {
            $_images_uploadimage: function() {

            },
            $_images_changeimagefolder: function(event) {
                if (event.keyCode !== 13) {
                    return;
                }
                const app = this;
                axios
                    .post('/change_image_folder', {
                        id: event.target.id.slice(9),
                        name: this.newfolder
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.$_images_getimages();
                            app.newfolder = '';
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            $_images_confirmdelete: function() {
                this.confirm = true;
            },
            $_images_canceldelete: function() {
                this.confirm = false;
            },
            $_images_deleteimage: function(event) {
                const app = this;
                axios
                    .post('/delete_image', {
                        id: event.target.id.slice(7)
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.$_images_canceldelete();
                            app.$_images_getimages();
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            $_images_prevposition: function(event) {
                const imagesToSwap = this.images.filter(function(v, i, a) { return v.id == event.target.id.slice(4) || (a[i + 1] && a[i + 1].id == event.target.id.slice(4)) });
                if (foldersToSwap.length < 2) {
                    return;
                } else {
                    this.$_images_swapimages(imagesToSwap);
                }
            },
            $_images_nextposition: function(event) {
                const imagesToSwap = this.images.filter(function(v, i, a) { return v.id == event.target.id.slice(4) || (a[i - 1] && a[i - 1].id == event.target.id.slice(4)) });
                if (foldersToSwap.length < 2) {
                    return;
                } else {
                    this.$_images_swapimages(imagesToSwap);
                }
            },
            $_images_swapimages: function(imagesToSwap) {
                const app = this;
                axios
                    .post('/swap_images', {
                        id_one: imagesToSwap[0].id,
                        position_one: imagesToSwap[0].position,
                        id_two: imagesToSwap[1].id,
                        position_two: imagesToSwap[1].position
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            app.$_images_getimages();
                        } else {
                            app.message = 'Da ist was schiefgelaufen .';
                        }
                    })
                    .catch(function(err) {
                        console.log(err);
                        app.message = 'Der Server antwortet nicht .';
                    });
            },
            $_images_getimages: function() {
                const app = this;
                axios
                    .post('/get_images', {
                        id: this.$route.params.id
                    })
                    .then(function(resp) {
                        if (resp.data.success) {
                            console.log(resp.data.images);
                            app.images = resp.data.images;
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
            this.$_images_getimages();
        }
    });

    // contact component

    const Contact = Vue.extend({
        template: '#contact-template',
        props: {
            admin: Boolean
        },
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
            $_contact: function() {
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
            this.$_contact();
        }
    });

    // about component

    const About = Vue.extend({
        template: '#about-template',
        props: {
            admin: Boolean
        },
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
            $_about: function() {
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
            this.$_about();
        }
    });

    // admin component

    const Admin = Vue.extend({
        template: '#admin-template',
        data: function() {
            return {
                message: 'Hi Jens!',
                pw: '',
                timeoutID: ''
            }
        },
        methods: {
            $_admin_login: function(event) {
                if (event.type !== 'click' && event.keyCode !== 13) {
                    return;
                }
                if (this.timeoutID) {
                    window.clearTimeout(this.timeoutID);
                }
                const app = this;
                this.timeoutID = window.setTimeout(function() {
                    const appNxt = app;
                    axios
                        .post('/login', { pw: app.pw })
                        .then(function(resp) {
                            if (resp.data.success) {
                                window.location.replace('/');
                                appNxt.timeoutID = '';
                            } else {
                                appNxt.message = 'Falsches Passwort .';
                            }
                        })
                        .catch(function(err) {
                            console.log(err);
                            appNxt.message = 'Der Server antwortet nicht .';
                        });
                }, 500);
            }
        }
    });

    // app

    const router = new VueRouter({
        routes: [
            { path: '/projects', component: Projects },
            { path: '/folder/:id', component: Folder },
            { path: '/contact', component: Contact },
            { path: '/about', component: About },
            { path: '/ichbinfalkenthal', component: Admin }
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
            $_app_logout: function() {
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
                .get('/is_admin')
                .then(function(resp) {
                    app.admin = resp.data.admin;
                })
                .catch(function(err) {
                    console.log(err);
                });
        }
    });

})();
