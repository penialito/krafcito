// Fix for the checkAuth function in dashboard.js
// Replace the existing checkAuth function with this one

async function checkAuth() {
    try {
        // Use the globally available initializeSupabase function
        supabaseClient = await window.initializeSupabase();
        
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        if (!data.session) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
            return false;
        }
        
        // Store current user for later use
        currentUser = data.session.user;
        
        // Get user role
        const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single();
            
        if (userError) {
            console.error('Error getting user role:', userError);
            userRole = 'user'; // Default role
        } else {
            userRole = userData?.role || 'user';
        }
        
        // Update UI based on role
        if (userRole === 'admin' || userRole === 'tecnico') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.classList.remove('d-none');
            });
        }
        
        // Show user info in header
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.textContent = currentUser.email;
        }
        
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        // Handle error gracefully
        window.location.href = 'login.html?error=' + encodeURIComponent(error.message || 'Error de autenticación');
        return false;
    }
}
