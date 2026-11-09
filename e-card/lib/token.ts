import crypto from 'crypto' 
export const generateToken = () => crypto.randomBytes(32).toString("base64url")
export const hashToken = (t: string) => 
    crypto.createHash("sha256").update(t).digest("hex")