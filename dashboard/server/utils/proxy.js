const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { getCollection, updateCollection } = require('../db');
const crypto = require('crypto');

let rotationIndex = 0;

function normalizeProxy(raw) {
  const str = raw.trim();
  if (!str) return null;
  if (/^(https?|socks[45]):\/\//i.test(str)) return str;
  const parts = str.split(':');
  if (parts.length === 2) return `http://${parts[0]}:${parts[1]}`;
  if (parts.length === 4) {
    const [ip, port, user, pass] = parts;
    return `http://${user}:${pass}@${ip}:${port}`;
  }
  return `http://${str}`;
}

async function loadProxies() {
  return getCollection('proxies');
}

async function addProxies(list) {
  const existing = await loadProxies();
  const existingUrls = new Set(existing.map((p) => p.url));
  const added = [];

  for (const raw of list) {
    const url = normalizeProxy(raw);
    if (!url || existingUrls.has(url)) continue;
    const proxy = {
      id: `proxy-${crypto.randomBytes(4).toString('hex')}`,
      raw: raw.trim(), url, working: null,
      last_used: null, last_tested: null, fail_count: 0,
      avg_latency: null, addedAt: new Date().toISOString(),
    };
    existing.push(proxy);
    existingUrls.add(url);
    added.push(proxy);
  }

  await updateCollection('proxies', existing);
  return { added: added.length, total: existing.length };
}

async function removeProxy(id) {
  const proxies = await loadProxies();
  const filtered = proxies.filter((p) => p.id !== id);
  if (filtered.length === proxies.length) return false;
  await updateCollection('proxies', filtered);
  return true;
}

async function getNextProxy() {
  const proxies = await loadProxies();
  if (proxies.length === 0) return null;

  const usable = proxies.filter((p) => p.fail_count <= 5);
  if (usable.length === 0) {
    console.warn('[proxy] All proxies have exceeded fail threshold!');
    return null;
  }

  rotationIndex = rotationIndex % usable.length;
  const chosen = usable[rotationIndex];
  rotationIndex++;

  const allProxies = await loadProxies();
  const idx = allProxies.findIndex((p) => p.id === chosen.id);
  if (idx !== -1) {
    allProxies[idx].last_used = new Date().toISOString();
    await updateCollection('proxies', allProxies);
  }

  return chosen.url;
}

function createProxyAgent(proxyUrl) {
  if (/^socks[45]:\/\//i.test(proxyUrl)) return new SocksProxyAgent(proxyUrl);
  return new HttpsProxyAgent(proxyUrl);
}

async function testProxy(proxyUrl) {
  const start = Date.now();
  try {
    const agent = createProxyAgent(proxyUrl);
    const response = await axios.get('https://httpbin.org/ip', {
      httpAgent: agent, httpsAgent: agent, timeout: 15000,
    });
    const latency = Date.now() - start;
    const ip = response.data?.origin || 'unknown';

    const proxies = await loadProxies();
    const idx = proxies.findIndex((p) => p.url === proxyUrl);
    if (idx !== -1) {
      proxies[idx].working = true;
      proxies[idx].last_tested = new Date().toISOString();
      proxies[idx].fail_count = 0;
      proxies[idx].avg_latency = proxies[idx].avg_latency
        ? Math.round((proxies[idx].avg_latency + latency) / 2)
        : latency;
      await updateCollection('proxies', proxies);
    }
    return { working: true, ip, latency };
  } catch (err) {
    const latency = Date.now() - start;
    const proxies = await loadProxies();
    const idx = proxies.findIndex((p) => p.url === proxyUrl);
    if (idx !== -1) {
      proxies[idx].working = false;
      proxies[idx].last_tested = new Date().toISOString();
      proxies[idx].fail_count = (proxies[idx].fail_count || 0) + 1;
      await updateCollection('proxies', proxies);
    }
    return { working: false, error: err.message, latency };
  }
}

async function markProxyFailed(proxyUrl) {
  const proxies = await loadProxies();
  const idx = proxies.findIndex((p) => p.url === proxyUrl);
  if (idx !== -1) {
    proxies[idx].fail_count = (proxies[idx].fail_count || 0) + 1;
    proxies[idx].working = false;
    await updateCollection('proxies', proxies);
  }
}

module.exports = { loadProxies, addProxies, removeProxy, getNextProxy, testProxy, createProxyAgent, markProxyFailed, normalizeProxy };
