const User = require("../models/user");
const Blog = require('../models/blog');
const jwt = require('jsonwebtoken');
const config = require('../config/database');

module.exports = (router) => {

    router.post('/newBlog', (req, res) => {
        if (!req.body.title) {
            res.json({ success: false, message: 'Post title is required' });
        } else {
            if (!req.body.body) {
                res.json({ success: false, message: 'Post body is required' });
            } else {
                if (!req.body.createdBy) {
                    res.json({ success: false, message: 'Post creator is required' });
                } else {
                    const blog = new Blog({
                        title: req.body.title,
                        body: req.body.body,
                        createdBy: req.body.createdBy
                    });
                    blog.save((err) => {
                        if (err) {
                            if (err.errors) {
                                if (err.errors.title) {
                                    res.json({ success: false, message: err.errors.title.message });
                                } else {
                                    if (err.errors.body) {
                                        res.json({ success: false, message: err.errors.body.message });
                                    } else {
                                        res.json({ success: false, message: err.errmsg });
                                    }
                                }
                            } else {
                                res.json({ success: false, message: err });
                            }
                        } else {
                            res.json({ success: true, message: 'Post saved!' });
                        }
                    });
                }
            }
        }
    });

    router.get('/allBlogs', (req, res) => {
        Blog.find({}, (err, blogs) => {
            if (err) {
                res.json({ success: false, message: err });
            } else {
                if (!blogs) {
                    res.json({ success: false, message: 'No blogs found.' });
                } else {
                    res.json({ success: true, blogs: blogs });
                }
            }
        }).sort({ '_id': -1 });
    });

    router.get('/blog/:id', (req, res) => {
        if (!req.params.id) {
            res.json({ success: false, message: 'No blog ID was provided.' });
        } else {
            Blog.findOne({ _id: req.params.id }, (err, blog) => {
                if (err) {
                    res.json({ success: false, message: 'Not a valid blog id' });
                } else {
                    if(!blog) {
                        res.json({ success: false, message: 'No blogs found.' });
                    } else {
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                              if (!user) {
                                res.json({ success: false, message: 'Unable to authenticate user.' });
                                } else {
                                    if (user.username !== blog.createdBy) {
                                        res.json({ success: false, message: 'You are not authorised to edit this blog post.' });
                                    } else {
                                        res.json({ success: true, blog:  blog });
                                    }
                                }
                            }
                        });
                    }
                }
            });    
        }
    });

    router.put('/updateBlog', (req, res) => {
        if (req.body.id) {
            res.json({ success: false, message: 'No blog ID was provided.' });
        } else {
            Blog.findOne({ _id: req.body.id }, (err, blog) => {
                if (err) {
                    res.json({ success: false, message: 'Not a valid blog ID.' });
                } else {
                    if (!blog) {
                        res.json({ success: false, message: 'Blog ID was not found.' });
                    } else {
                        User.findOne({ _id: req.decoded.userId }, (err, user) => {
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                                if (!user) {
                                    res.json({ success: false, message: 'Unable to authenticate user.' });
                                } else {
                                    if (user.username !== blog.createdBy) {
                                        res.json({ success: false, message: 'You are not authorised to edit this blog post.' });
                                    } else {
                                        blog.title = req.body.title;
                                        blog.body = req.body.body;
                                        blog.save((err) => {
                                            if (err) {
                                                res.json({ success: false, message: err });
                                            } else {
                                                res.json({ success: true, message: 'Blog Updated!' });
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            })
        }
    });

    router.delete('/deleteBlog/:id', (req, res) => {
        if (!req.params._id) {
            res.json({ success: false, message: 'No blog ID provided.' });
        } else {
            Blog.findOne({ _id: req.params._id }, (err, blog) => {
                if (err) {
                    res.json({ success: false, message: 'Invalid id.' });
                } else {
                    if (!blog) {
                        res.json({ success: false, message: 'ID was not found.' });
                    } else {
                        User.findOne({ _id: req.decoded.userId}, (err, user) => {
                            if (err) {
                                res.json({ success: false, message: err });
                            } else {
                                if (!user) {
                                    res.json({ success: false, message: 'Unable to authenticate user' });
                                } else {
                                    if (user.username !== blog.createdBy) {
                                        res.json({ success: false, message: 'You are not authorised to delete this blog post.' }); 
                                    } else {
                                        blog.remove((err) => {
                                            if (err) {
                                                res.json({ success: false, message: err });
                                            } else {
                                                res.json({ success: true, message: 'Blog deleted!' });
                                            }
                                        })
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
    });

    router.put('/likeBlog', (req, res) => {
        if (!req.body.id) {
            res.json({ success: false, message: 'No id was provided' });
        } else {
            Blog.findOne({ _id: req.body.id }, (err, blog) => {
                if (err) {
                    res.json({ success: false, message: 'No id was provided' });
                } else {
                    if (!blog) {
                        res.json({ success: false, message: 'That blog was not found' });
                    } else {
                        User.findOne({ _id: req.decoded.userId}, (err, user) => {
                            if (err) {
                                res.json({ success: false, message: 'Something went twrong' });
                            } else {
                                if (!user) {
                                    res.json({ success: false, message: 'Could not authenticate user.' });
                                } else {
                                    if (blog.likedBy.includes(user.username)) {
                                        res.json({ success: false, message: 'You have already liked this blog!'})
                                    } else {
                                        if (blog.dislikedBy.includes(user.username)) {
                                            blog.dislikes--;
                                            const arrayIndex = blog.dislikedBy.indexOf(user.username);
                                            blog.dislikedBy.splice(arrayIndex, 1);
                                            blog.likes++;
                                            blog.likedBy.push(user.username);
                                            blog.save((err) => {
                                                if (err) {
                                                    res.json({ success: false, message: 'Something went twrong' });
                                                } else {
                                                    res.json({ success: true, message: 'Blog liked!'})
                                                }
                                            });
                                        } else {
                                            blog.likes++;
                                            blog.likedBy.push(user.username);
                                            blog.save((err) => {
                                                if (err) {
                                                    res.json({ success: false, message: 'Something went twrong' });
                                                } else {
                                                    res.json({ success: true, message: 'Blog liked!'})
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
    })

    router.put('/dislikeBlog', (req, res) => {
        if (!req.body.id) {
            res.json({ success: false, message: 'No id was provided' });
        } else {
            Blog.findOne({ _id: req.body.id }, (err, blog) => {
                if (err) {
                    res.json({ success: false, message: 'No id was provided' });
                } else {
                    if (!blog) {
                        res.json({ success: false, message: 'That blog was not found' });
                    } else {
                        User.findOne({ _id: req.decoded.userId}, (err, user) => {
                            if (err) {
                                res.json({ success: false, message: 'Something went twrong' });
                            } else {
                                if (!user) {
                                    res.json({ success: false, message: 'Could not authenticate user.' });
                                } else {
                                    if (blog.dislikedBy.includes(user.username)) {
                                        res.json({ success: false, message: 'You have already disliked this blog!'})
                                    } else {
                                        if (blog.likedBy.includes(user.username)) {
                                            blog.likes--;
                                            const arrayIndex = blog.likedBy.indexOf(user.username);
                                            blog.likedBy.splice(arrayIndex, 1);
                                            blog.dislikes++;
                                            blog.dislikedBy.push(user.username);
                                            blog.save((err) => {
                                                if (err) {
                                                    res.json({ success: false, message: 'Something went twrong' });
                                                } else {
                                                    res.json({ success: true, message: 'Blog disliked!'})
                                                }
                                            });
                                        } else {
                                            blog.dislikes++;
                                            blog.dislikedBy.push(user.username);
                                            blog.save((err) => {
                                                if (err) {
                                                    res.json({ success: false, message: 'Something went twrong' });
                                                } else {
                                                    res.json({ success: true, message: 'Blog disliked!'})
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
    })

    router.post('/comment', (req, res) => {
        if (!req.body.comment) {
            res.json({ success: false, message: "no comment provided." });
        } else {
            if(!req.body.id) {
                res.json({ success: false, message: 'No id provided.' });
            } else {
                Blog.findOne({ _id: req.body.id }, (err, blog) => {
                    if (err) {
                        res.json({ success: false, message: 'Invalid blog id.' });  
                    } else {
                        if (!blog) {
                            res.json({ success: false, message: 'Blog not found' });
                        } else {
                            User.findOne({ _id: req.decoded.userId}, (err, user)=> {
                                if (err) {
                                    res.json({ success: false, message: 'Something went wrong.'});
                                } else {
                                    if (!user) {
                                        res.json({ success: false, message: 'User not found.'});
                                    } else {
                                        blog.comments.push({
                                            comment: req.body.comment,
                                            commentator: user.username
                                        });
                                        blog.save((err) => {
                                            if (err) {
                                                res.json({ success: false, message: 'Something went wrong.'});
                                            } else {
                                                res.json({ success: true, message: 'Comment saved.'});
                                            }
                                        });
                                    }
                                }
                            })
                        }
                    }
                });
            }
        }
    });

  return router;
};

