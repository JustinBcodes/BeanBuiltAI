// Environment validation for NextAuth production setup
export function validateNextAuthEnvironment() {
  const requiredEnvVars = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  }

  const missingVars: string[] = []
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key)
    }
  })

  if (missingVars.length > 0) {
    const errorMessage = `❌ Missing required environment variables for NextAuth: ${missingVars.join(', ')}`
    console.error(errorMessage)
    
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Only throw in production runtime, not during build
      throw new Error(errorMessage)
    } else {
      console.warn('⚠️ Development/build mode: Some environment variables are missing but continuing...')
    }
  }

  // Validate NEXTAUTH_URL format only in production runtime (not during build)
  if (process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL && typeof window !== 'undefined') {
    try {
      const url = new URL(process.env.NEXTAUTH_URL)
      if (!url.protocol.startsWith('https')) {
        throw new Error('NEXTAUTH_URL must use HTTPS in production')
      }
      console.log('✅ NEXTAUTH_URL validation passed:', process.env.NEXTAUTH_URL)
    } catch (error) {
      console.error('❌ Invalid NEXTAUTH_URL format:', error)
      throw error
    }
  }

  console.log('✅ NextAuth environment validation passed')
  return true
}

// Validate on module load
validateNextAuthEnvironment() 