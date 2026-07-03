import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './env.js';
import { userService } from '../modules/auth/auth.service.js';

passport.use(
    new GoogleStrategy(
        {
            clientID: config.GOOGLE.CLIENT_ID as string,
            clientSecret: config.GOOGLE.CLIENT_SECRET as string,
            callbackURL: '/api/auth/google/callback'
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
                const email = profile.emails?.[0].value;
                if (!email) {
                    return done(new Error('No email found from Google profile'), undefined);
                }

                // 1. Check if user exists with this google_id
                const result = await (await import('./db.js')).db.query(
                    'SELECT * FROM users WHERE google_id = $1 OR email = $2',
                    [profile.id, email]
                );

                let user = result.rows[0];

                if (!user) {
                    // 2. Create new user if not found
                    user = await userService.create({
                        firstname: profile.name?.givenName,
                        lastname: profile.name?.familyName,
                        fullname: profile.displayName,
                        email: email,
                        google_id: profile.id,
                        avatar_url: profile.photos?.[0].value,
                        email_verified: true // Google emails are pre-verified
                    });
                } else if (!user.google_id) {
                    // 3. Link existing email-only account to Google
                    await (await import('./db.js')).db.query(
                        'UPDATE users SET google_id = $1, avatar_url = $2, email_verified = true WHERE id = $3',
                        [profile.id, profile.photos?.[0].value, user.id]
                    );
                    user.google_id = profile.id;
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);

// We are using JWT, so we don't need session serialization, 
// but passport might complain if we don't define them if session is semi-enabled
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const user = await userService.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
