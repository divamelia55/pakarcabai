document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (result.success) {
            // simpan status login
            localStorage.setItem('adminLogin', 'true');
            localStorage.setItem('adminUsername', result.admin.username);

            alert('Login berhasil');
            window.location.href = 'admin.html';
        } else {
            alert(result.message);
        }

    } catch (error) {
        console.error(error);
        alert('Gagal koneksi ke server');
    }
});
