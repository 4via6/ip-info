function isTerminalRequest() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('postman');
}

async function handleTerminalRequest() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const formattedOffset = formatUTCOffset(data.utc_offset);
        // Return plain text format for terminal
        return `IP Address: ${data.ip}
ASN: ${data.asn}
ISP: ${data.org}
Location: ${data.city}, ${data.region}, ${data.country_name}
Timezone: ${data.timezone} (UTC${formattedOffset})
Connection: ${window.location.protocol === 'https:' ? 'HTTPS' : 'HTTP'}
IP Version: ${data.ip.includes(':') ? 'IPv6' : 'IPv4'}`;
    } catch (error) {
        return 'Error fetching IP information';
    }
}

// Add this new helper function
function formatUTCOffset(offset) {
    if (!offset) return '+00:00';
    
    // Handle the sign
    const sign = offset.startsWith('-') ? '-' : '+';
    // Remove any sign and ensure it's a 4-digit string
    const digits = offset.replace(/[+-]/g, '').padStart(4, '0');
    // Insert the colon
    return `${sign}${digits.slice(0,2)}:${digits.slice(2)}`;
}

async function detectConnectionType() {
    return window.location.protocol === 'https:' ? 'HTTPS' : 'HTTP';
}

async function detectProxy() {
    try {
        const webRTC = await detectWebRTCLeak();
        return webRTC.isProxy;
    } catch (error) {
        return 'Unknown';
    }
}

async function detectWebRTCLeak() {
    return new Promise((resolve) => {
        const rtcPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        if (!rtcPeerConnection) {
            resolve({ isProxy: 'Unknown' });
            return;
        }
        const pc = new rtcPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        pc.createOffer().then(pc.setLocalDescription.bind(pc));
        
        pc.onicecandidate = (ice) => {
            if (!ice.candidate) {
                resolve({ isProxy: 'No' });
                return;
            }
            const isProxy = ice.candidate.candidate.includes('relay');
            resolve({ isProxy: isProxy ? 'Yes' : 'No' });
            pc.close();
        };
    });
}

async function fetchIPInfo() {
    try {
        const [ipResponse, connectionType, proxyStatus] = await Promise.all([
            fetch('https://ipapi.co/json/', {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'IP-Info-Tool/1.0'
                },
                mode: 'cors'
            }),
            detectConnectionType(),
            detectProxy()
        ]);
        
        // Add error check for Cloudflare rate limiting
        if (ipResponse.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        const data = await ipResponse.json();
        const formattedOffset = formatUTCOffset(data.utc_offset);
        
        document.getElementById('ip').textContent = data.ip;
        document.getElementById('asn').textContent = data.asn.replace(/^AS/, '');
        document.getElementById('isp').textContent = data.org;
        document.getElementById('location').textContent = `${data.city}, ${data.region}, ${data.country_name}`;
        document.getElementById('timezone').textContent = `${data.timezone} (UTC${formattedOffset})`;
        document.getElementById('connection').textContent = connectionType;
        document.getElementById('iptype').textContent = data.ip.includes(':') ? 'IPv6' : 'IPv4';
        document.getElementById('proxy').textContent = proxyStatus;
        
    } catch (error) {
        console.error('Error fetching info:', error);
        const errorMessage = error.message === 'Rate limit exceeded. Please try again later.' 
            ? error.message 
            : 'Error loading data';
            
        const elements = ['ip', 'asn', 'isp', 'location', 'timezone', 'connection', 'iptype', 'proxy'];
        elements.forEach(id => {
            document.getElementById(id).textContent = errorMessage;
        });
    }
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    const copyIcon = element.parentElement.parentElement.querySelector('.copy-icon');
    
    navigator.clipboard.writeText(text)
        .then(() => {
            copyIcon.classList.remove('copied');
            copyIcon.offsetHeight; // Trigger reflow
            copyIcon.classList.add('copied');
            
            // Update tooltip text temporarily
            const tooltip = copyIcon.querySelector('.tooltip');
            tooltip.textContent = 'Copied!';
            setTimeout(() => {
                tooltip.textContent = 'Copy';
            }, 1000);
        })
        .catch(err => console.error('Failed to copy:', err));
}

document.addEventListener('DOMContentLoaded', async () => {
    if (isTerminalRequest()) {
        const terminalResponse = await handleTerminalRequest();
        document.body.innerHTML = `<pre>${terminalResponse}</pre>`;
        return;
    }
    fetchIPInfo();
});
