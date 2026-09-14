/**
 * AuthCallback Page
 * Handles ALL Supabase email redirects:
 *  - Email confirmation  (type=signup)   → redirect to dashboard
 *  - Magic link          (type=magiclink) → redirect to dashboard
 *  - Password reset      (type=recovery)  → redirect to /set-password
 *
 * Supabase fires onAuthStateChange with the appropriate event so we can
 * branch on PASSWORD_RECOVERY vs SIGNED_IN.
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { CheckCircle, LockReset, Error as ErrorIcon } from '@mui/icons-material';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'recovery' | 'error'
  const [message, setMessage] = useState('');

  // Use a ref to track the status to prevent stale closure bugs in setTimeout/async loops
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!supabase) {
      setStatus('error');
      setMessage('Supabase client not initialised.');
      return;
    }

    let isSubscribed = true;

    // onAuthStateChange fires automatically when Supabase processes the URL token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isSubscribed) return;
      console.log('AuthCallback: onAuthStateChange event =', event);

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked a password-reset link → send them to set a new password
        setStatus('recovery');
        setMessage('Identity confirmed. Redirecting to set your new password…');
        setTimeout(() => {
          if (isSubscribed) {
            subscription.unsubscribe();
            navigate('/set-password', { replace: true });
          }
        }, 1500);

      } else if (event === 'SIGNED_IN' && session) {
        // Email confirmation or magic link → go to dashboard
        setStatus('success');
        setMessage('Email verified! Redirecting to your dashboard…');
        setTimeout(() => {
          if (isSubscribed) {
            subscription.unsubscribe();
            navigate('/', { replace: true });
          }
        }, 1500);
      }
    });

    const handleExchange = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          console.log('AuthCallback: Exchanging PKCE code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } catch (err) {
          console.error('AuthCallback: PKCE code exchange failed:', err);
          if (isSubscribed) {
            setStatus('error');
            setMessage(err.message || 'Authentication code exchange failed.');
          }
        }
      } else {
        // Fallback: if Supabase already exchanged the token before we subscribed (Implicit Flow),
        // check the current session directly.
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (session && statusRef.current === 'verifying') {
            setStatus('success');
            setMessage('Logged in successfully! Redirecting…');
            setTimeout(() => {
              if (isSubscribed) {
                subscription.unsubscribe();
                navigate('/', { replace: true });
              }
            }, 1500);
          }
        } catch (err) {
          console.error('AuthCallback: Session check failed:', err);
          if (isSubscribed) {
            setStatus('error');
            setMessage(err.message || 'Session check failed.');
          }
        }
      }
    };

    handleExchange();

    // Timeout: if nothing happens in 10s, show a helpful error
    const timeout = setTimeout(() => {
      if (isSubscribed && statusRef.current === 'verifying') {
        subscription.unsubscribe();
        setStatus('error');
        setMessage('The link may have expired or already been used. Please request a new one.');
      }
    }, 10000);

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const brandHeader = (
    <Typography variant="h5" sx={{
      fontFamily: '"Playfair Display", Georgia, serif',
      color: '#322D29', fontWeight: 800, letterSpacing: '0.02em', mb: 0.5
    }}>
      KP <Box component="span" sx={{ color: '#72383D' }}>Creation</Box>
    </Typography>
  );

  return (
    <Box sx={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #EFE9E1 0%, #D1C7BD 100%)',
      gap: 3, px: 3, textAlign: 'center'
    }}>
      <Box sx={{
        bgcolor: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px)',
        borderRadius: 4, p: { xs: 4, sm: 6 }, maxWidth: 420, width: '100%',
        boxShadow: '0 24px 64px rgba(50,45,41,0.10)',
        border: '1px solid rgba(209,199,189,0.5)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5
      }}>
        {brandHeader}

        {status === 'verifying' && (
          <>
            <CircularProgress size={48} sx={{ color: '#72383D' }} />
            <Typography sx={{ color: '#6B6360', fontSize: '0.95rem' }}>
              Verifying your link…
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle sx={{ fontSize: 56, color: '#22C55E' }} />
            <Alert severity="success" sx={{ bgcolor: 'rgba(34,197,94,0.08)', color: '#16A34A', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 2, width: '100%' }}>
              {message}
            </Alert>
          </>
        )}

        {status === 'recovery' && (
          <>
            <LockReset sx={{ fontSize: 56, color: '#72383D' }} />
            <Alert severity="info" sx={{ bgcolor: 'rgba(114,56,61,0.06)', color: '#72383D', border: '1px solid rgba(114,56,61,0.2)', borderRadius: 2, width: '100%' }}>
              {message}
            </Alert>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon sx={{ fontSize: 56, color: '#72383D' }} />
            <Alert severity="error" sx={{ bgcolor: 'rgba(114,56,61,0.08)', color: '#72383D', border: '1px solid rgba(114,56,61,0.2)', borderRadius: 2, width: '100%' }}>
              {message}
            </Alert>
            <Typography
              onClick={() => navigate('/login')}
              sx={{ color: '#72383D', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
            >
              Back to Login
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default AuthCallback;
