const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
};

const isAdmin = (req,res,next)=>{
    if(req.session.user && req.session.user.role === 'admin'){
        return next();
    }
    res.status(403).render('pages/error',{
        title: 'ไม่มีสิทธ์เข้าถึง',
        layout: 'layouts/main',
        statusCode: '403',
        message: 'You are not fucking acces this page '
    });
}


module.exports = {
    isAuthenticated,
    isAdmin
}; 