import React, { useEffect, useMemo, useState } from 'react';
import type { GeneratedProject } from './types';

interface WebToAppProps {
  activeProject: GeneratedProject | null;
  apiBase: string;
  email: string;
  token: string;
  installationId: string;
}

type QualityCheck = { label: string; status: 'pass' | 'warn' | 'fail'; detail: string };
type BuildHistoryEntry = { id: string; createdAt: string; status: 'ready' | 'failed'; artifactName?: string; sha256?: string; error?: string };

export function WebToAppPackager({ activeProject, apiBase, email, token, installationId }: WebToAppProps) {
  const [appName, setAppName] = useState(activeProject?.title || 'Quantora Mobile');
  const [packageName, setPackageName] = useState('ai.quantora.mobile');
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState('100');
  const [targetSdk, setTargetSdk] = useState('API 35 (Android 15 Upside Down Cake)');
  const [themeColor, setThemeColor] = useState('#0284c7');
  const [appIcon, setAppIcon] = useState('💎');
  const [activeTab, setActiveTab] = useState<'config' | 'manifest' | 'gradle' | 'build'>('config');

  // Native Hardware Permissions & Bridges
  const [permCamera, setPermCamera] = useState(true);
  const [permPush, setPermPush] = useState(true);
  const [permStorage, setPermStorage] = useState(true);
  const [permLocation, setPermLocation] = useState(false);
  const [permBiometrics, setPermBiometrics] = useState(true);
  const [permOfflineCache, setPermOfflineCache] = useState(true);
  const [enableDeepLinks, setEnableDeepLinks] = useState(true);

  // Real Gradle build-job state
  const [building, setBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [apkReady, setApkReady] = useState(false);
  const [buildJobId, setBuildJobId] = useState<string | null>(null);
  const [buildError, setBuildError] = useState("");
  const [artifactName, setArtifactName] = useState("");
  const [artifactSha256, setArtifactSha256] = useState("");

  const [projectPreviewHtml, setProjectPreviewHtml] = useState(activeProject?.previewHtml || '');
  const [loadingProjectSource, setLoadingProjectSource] = useState(false);
  const [projectSourceError, setProjectSourceError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!activeProject?.id) {
      setProjectPreviewHtml('');
      setProjectSourceError('');
      return () => { cancelled = true; };
    }
    if (activeProject.previewHtml) {
      setProjectPreviewHtml(activeProject.previewHtml);
      setProjectSourceError('');
      return () => { cancelled = true; };
    }
    setLoadingProjectSource(true);
    setProjectSourceError('');
    void fetch(`${apiBase}/projects/${encodeURIComponent(activeProject.id)}?email=${encodeURIComponent(email)}`, { headers: { authorization: `Bearer ${token}`, 'X-Device-Id': installationId } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { version?: { preview_html?: string } };
        if (!response.ok || !data.version?.preview_html) throw new Error('Open project source is not available yet.');
        if (!cancelled) setProjectPreviewHtml(data.version.preview_html);
      })
      .catch((error: unknown) => { if (!cancelled) setProjectSourceError(error instanceof Error ? error.message : 'Could not load project source.'); })
      .finally(() => { if (!cancelled) setLoadingProjectSource(false); });
    return () => { cancelled = true; };
  }, [activeProject?.id, activeProject?.previewHtml, apiBase, email, installationId, token]);

  const buildStages = [
    'Queued isolated Gradle build job',
    'Prepared Android template and website assets',
    'Running Gradle assembleDebug',
    'Verified APK artifact and SHA-256 checksum'
  ];
  const previewHtml = projectPreviewHtml;
  const qualityChecks = useMemo<QualityCheck[]>(() => {
    const checks: QualityCheck[] = [];
    const htmlBytes = new TextEncoder().encode(previewHtml).byteLength;
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(previewHtml);
    const hasTitle = /<title>[^<]+<\/title>/i.test(previewHtml);
    const hasBody = /<body[\s>]/i.test(previewHtml);
    const packageOk = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,5}$/.test(packageName.trim());
    const appNameOk = appName.trim().length > 0 && appName.trim().length <= 48;
    const versionOk = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][a-zA-Z0-9.-]+)?$/.test(versionName.trim());
    const versionCodeNumber = Number(versionCode);
    checks.push({ label: 'Project selected', status: activeProject?.id ? 'pass' : 'fail', detail: activeProject?.id ? `Owned project ${activeProject.id}` : 'Open or select a generated project first.' });
    checks.push({ label: 'Website source loaded', status: projectPreviewHtml ? 'pass' : 'fail', detail: projectPreviewHtml ? 'Latest preview HTML is ready.' : loadingProjectSource ? 'Loading the latest saved project version…' : projectSourceError || 'Open or generate the project before building.' });
    checks.push({ label: 'App name', status: appNameOk ? 'pass' : 'fail', detail: appNameOk ? appName.trim() : 'Use 1–48 characters for the launcher name.' });
    checks.push({ label: 'Android package identifier', status: packageOk ? 'pass' : 'fail', detail: packageOk ? packageName.trim() : 'Use lowercase dot-separated applicationId syntax.' });
    checks.push({ label: 'Version metadata', status: versionOk && Number.isInteger(versionCodeNumber) && versionCodeNumber > 0 ? 'pass' : 'fail', detail: versionOk && Number.isInteger(versionCodeNumber) && versionCodeNumber > 0 ? `v${versionName} (${versionCodeNumber})` : 'Use semantic versionName and a positive integer versionCode.' });
    checks.push({ label: 'HTML size limit', status: htmlBytes <= 5 * 1024 * 1024 ? 'pass' : 'fail', detail: `${Math.ceil(htmlBytes / 1024)} KB of 5 MB allowed` });
    checks.push({ label: 'HTML document structure', status: hasBody ? 'pass' : 'fail', detail: hasBody ? 'Body element detected.' : 'Generated HTML must contain a body element.' });
    checks.push({ label: 'Mobile viewport', status: hasViewport ? 'pass' : 'warn', detail: hasViewport ? 'Viewport meta tag detected.' : 'Add a viewport meta tag for better Android rendering.' });
    checks.push({ label: 'Document title', status: hasTitle ? 'pass' : 'warn', detail: hasTitle ? 'Title detected.' : 'Add a title for a better app/web experience.' });
    return checks;
  }, [activeProject?.id, appName, loadingProjectSource, packageName, previewHtml, projectPreviewHtml, projectSourceError, versionCode, versionName]);
  const hasQualityFailures = qualityChecks.some((check) => check.status === 'fail');
  const historyKey = `quantora-apk-build-history:${activeProject?.id || 'none'}`;
  const [buildHistory, setBuildHistory] = useState<BuildHistoryEntry[]>(() => {
    try {
      const saved = window.localStorage.getItem(historyKey);
      return saved ? JSON.parse(saved) as BuildHistoryEntry[] : [];
    } catch {
      return [];
    }
  });

  const generatedManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}">

    <!-- Hardware & Native Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    ${permCamera ? '<uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />' : ''}
    ${permPush ? '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <uses-permission android:name="android.permission.VIBRATE" />' : ''}
    ${permLocation ? '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />' : ''}
    ${permBiometrics ? '<uses-permission android:name="android.permission.USE_BIOMETRIC" />\n    <uses-permission android:name="android.permission.USE_FINGERPRINT" />' : ''}
    ${permStorage ? '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />' : ''}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme.NoActionBar"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            ${enableDeepLinks ? `<!-- Custom Deep Linking Protocol -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="quantora" android:host="${packageName}" />
            </intent-filter>` : ''}
        </activity>
    </application>
</manifest>`;

  const generatedGradle = `apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'

android {
    namespace "${packageName}"
    compileSdkVersion 35
    defaultConfig {
        applicationId "${packageName}"
        minSdkVersion 24
        targetSdkVersion 35
        versionCode ${versionCode}
        versionName "${versionName}"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
            cruncherEnabled = false
        }
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.debug
        }
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk8:$kotlin_version"
    implementation "androidx.appcompat:appcompat:1.7.0"
    implementation "androidx.coordinatorlayout:coordinatorlayout:1.2.0"
    implementation "androidx.core:core-splashscreen:1.0.1"
    implementation project(':capacitor-android')
    implementation project(':capacitor-camera')
    implementation project(':capacitor-push-notifications')
    implementation project(':capacitor-status-bar')
}`;

  async function startApkBuild() {
    setActiveTab('build');
    if (!activeProject?.id) {
      setBuildError('Select or generate a project before starting an APK build.');
      return;
    }
    if (hasQualityFailures) {
      setBuildError('Fix the failed pre-build checks before starting Gradle.');
      return;
    }
    setBuilding(true);
    setApkReady(false);
    setBuildStep(0);
    setBuildJobId(null);
    setBuildError("");
    setArtifactName("");
    setArtifactSha256("");
    setBuildLogs([`[INFO] Submitting a real Gradle APK build for ${packageName} (${appName}).`]);
    let currentJobId: string | null = null;
    try {
      const response = await fetch(`${apiBase}/projects/${encodeURIComponent(activeProject?.id || "")}/build-apk`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email,
          installationId,
          appName,
          packageName,
          versionName,
          versionCode: Number(versionCode),
          previewHtml,
          files: activeProject?.files || []
        })
      });
      const data = await response.json().catch(() => ({})) as { id?: string; error?: string; status?: string };
      if (!response.ok || !data.id) throw new Error(data.error || "The real APK build service rejected the request.");
      currentJobId = data.id;
      setBuildJobId(data.id);
      setBuildStep(1);
      setBuildLogs((prev) => [...prev, `[INFO] Build job ${data.id} queued on the isolated Gradle worker.`]);
      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        const statusResponse = await fetch(`${apiBase}/projects/${encodeURIComponent(activeProject?.id || "")}/build-apk/${encodeURIComponent(currentJobId)}?email=${encodeURIComponent(email)}&installationId=${encodeURIComponent(installationId)}`, { headers: { authorization: `Bearer ${token}` } });
        const status = await statusResponse.json().catch(() => ({})) as { status?: string; logs?: string[]; sha256?: string; artifactName?: string; error?: string };
        if (!statusResponse.ok) throw new Error(status.error || "Could not read APK build status.");
        if (Array.isArray(status.logs)) setBuildLogs(status.logs);
        if (status.status === "building") setBuildStep(2);
        if (status.status === "ready") {
          setBuildStep(4);
          setApkReady(true);
          setBuilding(false);
          setArtifactName(status.artifactName || `${packageName}-v${versionName}-debug.apk`);
          setArtifactSha256(status.sha256 || "");
          const entry: BuildHistoryEntry = { id: currentJobId, createdAt: new Date().toISOString(), status: 'ready', artifactName: status.artifactName, sha256: status.sha256 };
          setBuildHistory((previous) => {
            const next = [entry, ...previous.filter((item) => item.id !== entry.id)].slice(0, 10);
            try { window.localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* local history is optional */ }
            return next;
          });
          return;
        }
        if (status.status === "failed") throw new Error(status.error || "Gradle APK build failed.");
      }
      throw new Error("APK build timed out after 4 minutes.");
    } catch (error) {
      setBuilding(false);
      const message = error instanceof Error ? error.message : "Real APK build failed.";
      setBuildError(message);
      setBuildHistory((previous) => {
        const entry: BuildHistoryEntry = { id: currentJobId || buildJobId || `failed-${Date.now()}`, createdAt: new Date().toISOString(), status: 'failed', error: message };
        const next = [entry, ...previous].slice(0, 10);
        try { window.localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* local history is optional */ }
        return next;
      });
      setBuildLogs((prev) => [...prev, `[ERROR] ${message}`]);
    }
  }

  async function downloadApkBinary() {
    if (!buildJobId) return;
    try {
      const response = await fetch(`${apiBase}/projects/${encodeURIComponent(activeProject?.id || "")}/build-apk/${encodeURIComponent(buildJobId)}/download?email=${encodeURIComponent(email)}&installationId=${encodeURIComponent(installationId)}`, { headers: { authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("The APK artifact is not available for download yet.");
      const blob = await response.blob();
      const signature = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
      const isZipContainer = signature.length === 4 && signature[0] === 0x50 && signature[1] === 0x4b && signature[2] === 0x03 && signature[3] === 0x04;
      if (!isZipContainer || blob.size < 4) throw new Error("The server response was not a valid APK binary.");
      const url = URL.createObjectURL(new Blob([blob], { type: "application/vnd.android.package-archive" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = artifactName || `${packageName}-v${versionName}-debug.apk`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setBuildError(error instanceof Error ? error.message : "Could not download the APK artifact.");
    }
  }

  function downloadBuildManifest() {
    const zipMetadata = {
      projectType: 'CAPACITOR_ANDROID_STUDIO_SOURCE',
      name: appName,
      packageName,
      files: {
        'android/app/src/main/AndroidManifest.xml': generatedManifestXml,
        'android/app/build.gradle': generatedGradle,
        'capacitor.config.json': JSON.stringify({
          appId: packageName,
          appName: appName,
          webDir: 'dist',
          plugins: {
            SplashScreen: { launchShowDuration: 2000, backgroundColor: themeColor }
          }
        }, null, 2)
      }
    };

    const blob = new Blob([JSON.stringify(zipMetadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-android-build-manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="feature-studio-container web-to-app-studio" style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div className="feature-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <span style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '1px' }}>
            NATIVE ANDROID APK COMPILER
          </span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
          Compile Website into Standalone Android APK
        </h2>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
          Build a real debug-signed Android APK from the selected website using the secured Gradle worker. The initial build scope packages the website in a Capacitor WebView; unsupported native plugins remain disabled until implemented.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'config' ? '#0284c7' : 'rgba(2, 132, 199, 0.08)',
            color: activeTab === 'config' ? '#ffffff' : '#0369a1',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          ⚙️ App Configuration
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manifest')}
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'manifest' ? '#0284c7' : 'rgba(2, 132, 199, 0.08)',
            color: activeTab === 'manifest' ? '#ffffff' : '#0369a1',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          📄 AndroidManifest.xml
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gradle')}
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'gradle' ? '#0284c7' : 'rgba(2, 132, 199, 0.08)',
            color: activeTab === 'gradle' ? '#ffffff' : '#0369a1',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          🐘 build.gradle
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('build')}
          style={{
            padding: '8px 16px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'build' ? '#0284c7' : 'rgba(2, 132, 199, 0.08)',
            color: activeTab === 'build' ? '#ffffff' : '#0369a1',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          ⚡ Live APK Compiler {apkReady ? '✓' : ''}
        </button>
      </div>

      {/* Tab 1: App Configuration */}
      {activeTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Packaging Specs */}
          <div style={{ background: '#ffffff', border: '1.5px solid rgba(226, 232, 240, 0.9)', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>
              📱 Android APK Identity & Metadata
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                App Name (Launcher Label)
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Package Identifier (applicationId)
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Version Name
                  <input
                    type="text"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Version Code
                  <input
                    type="text"
                    value={versionCode}
                    onChange={(e) => setVersionCode(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </label>
              </div>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Target Android SDK <small style={{ color: '#64748b' }}>(worker template setting)</small>
                <select
                  value={targetSdk}
                  disabled
                  onChange={(e) => setTargetSdk(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option>API 35 (Android 15 Upside Down Cake)</option>
                  <option>API 34 (Android 14)</option>
                  <option>API 33 (Android 13 Tiramisu)</option>
                </select>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  App Launcher Icon <small style={{ color: '#64748b' }}>(preview only)</small>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['💎', '🚀', '⚡', '👑', '🔥', '🌐'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAppIcon(emoji)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          border: appIcon === emoji ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          background: appIcon === emoji ? '#e0f2fe' : '#ffffff',
                          fontSize: '18px',
                          cursor: 'pointer'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Theme Color <small style={{ color: '#64748b' }}>(preview only)</small>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    style={{ width: '48px', height: '36px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Native Hardware Capabilities */}
          <div style={{ background: '#ffffff', border: '1.5px solid rgba(226, 232, 240, 0.9)', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>
              🔌 Native Hardware Bridges & Permissions
            </h3>

            <div style={{ display: 'grid', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', padding: '6px 0' }}>
                <input type="checkbox" checked={false} disabled style={{ accentColor: '#94a3b8', width: '16px', height: '16px' }} />
                <span>📸 <strong>Camera plugin</strong> <small style={{ color: '#64748b' }}>Not in the initial build scope</small></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', padding: '6px 0' }}>
                <input type="checkbox" checked={false} disabled style={{ accentColor: '#94a3b8', width: '16px', height: '16px' }} />
                <span>🔔 <strong>Push notifications</strong> <small style={{ color: '#64748b' }}>Requires a native plugin and Firebase setup</small></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', padding: '6px 0' }}>
                <input type="checkbox" checked={false} disabled style={{ accentColor: '#94a3b8', width: '16px', height: '16px' }} />
                <span>🛡️ <strong>Biometric authentication</strong> <small style={{ color: '#64748b' }}>Requires a native plugin implementation</small></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', padding: '6px 0' }}>
                <input type="checkbox" checked={false} disabled style={{ accentColor: '#94a3b8', width: '16px', height: '16px' }} />
                <span>📴 <strong>Offline storage</strong> <small style={{ color: '#64748b' }}>Requires app-specific runtime code</small></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', padding: '6px 0' }}>
                <input type="checkbox" checked={false} disabled style={{ accentColor: '#94a3b8', width: '16px', height: '16px' }} />
                <span>💾 <strong>File storage</strong> <small style={{ color: '#64748b' }}>Requires a native plugin implementation</small></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', padding: '6px 0' }}>
                <input type="checkbox" checked={false} disabled style={{ accentColor: '#94a3b8', width: '16px', height: '16px' }} />
                <span>🌐 <strong>Deep links</strong> <small style={{ color: '#64748b' }}>Requires verified Android intent configuration</small></span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void startApkBuild()}
              disabled={building || hasQualityFailures || !activeProject?.id}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: building || hasQualityFailures || !activeProject?.id ? 'not-allowed' : 'pointer',
                opacity: building || hasQualityFailures || !activeProject?.id ? 0.55 : 1,
                boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              🚀 Launch Native Android APK Build →
            </button>
          </div>

          <div style={{ marginTop: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>Pre-build quality checks</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>Deterministic checks run in the app before the request reaches Gradle.</p>
              </div>
              <span style={{ color: hasQualityFailures ? '#dc2626' : '#059669', fontWeight: 800, fontSize: '12px' }}>{hasQualityFailures ? 'Action required' : 'Ready to build'}</span>
            </div>
            <div style={{ display: 'grid', gap: '7px' }}>
              {qualityChecks.map((check) => (
                <div key={check.label} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '12px' }}>
                  <strong style={{ color: check.status === 'pass' ? '#059669' : check.status === 'warn' ? '#b45309' : '#dc2626' }}>{check.status === 'pass' ? 'PASS' : check.status === 'warn' ? 'WARN' : 'FAIL'}</strong>
                  <span style={{ color: '#334155', fontWeight: 700 }}>{check.label}</span>
                  <span style={{ color: '#64748b' }}>{check.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AndroidManifest.xml */}
      {activeTab === 'manifest' && (
        <div style={{ background: '#0f172a', borderRadius: '18px', padding: '16px', color: '#f8fafc', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Manifest reference preview (not executed)</span>

            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(generatedManifestXml)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}
            >
              📋 Copy XML
            </button>
          </div>
          <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '11px' }}>This is a local preview only. The secured build worker uses its validated Capacitor template and does not execute this browser-generated text.</p>
          <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.5, overflowX: 'auto', maxHeight: '420px' }}>
            {generatedManifestXml}
          </pre>
        </div>
      )}

      {/* Tab 3: build.gradle */}
      {activeTab === 'gradle' && (
        <div style={{ background: '#0f172a', borderRadius: '18px', padding: '16px', color: '#f8fafc', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Gradle reference preview (server template is authoritative)</span>

            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(generatedGradle)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}
            >
              📋 Copy Gradle
            </button>
          </div>
          <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '11px' }}>This is a local preview only. The secured build worker uses its validated Capacitor template and does not execute this browser-generated text.</p>
          <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.5, overflowX: 'auto', maxHeight: '420px' }}>
            {generatedGradle}
          </pre>
        </div>
      )}

      {/* Tab 4: Live Compiler Engine */}
      {activeTab === 'build' && (
        <div style={{ background: '#ffffff', border: '1.5px solid rgba(226, 232, 240, 0.9)', borderRadius: '20px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 900 }}>
                ⚡ Gradle & AAPT2 Compiler Pipeline
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                Real Gradle build for {packageName} (debug-signed APK)
              </p>
            </div>

            {!building && (
              <button
                type="button"
                onClick={() => void startApkBuild()}
                disabled={building || hasQualityFailures || !activeProject?.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: building || hasQualityFailures || !activeProject?.id ? 'not-allowed' : 'pointer',
                  opacity: building || hasQualityFailures || !activeProject?.id ? 0.55 : 1
                }}
              >
                🔄 Rebuild APK
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div style={{ background: '#e2e8f0', borderRadius: '9999px', height: '8px', overflow: 'hidden', marginBottom: '16px' }}>
            <div
              style={{
                width: building ? `${(buildStep / buildStages.length) * 100}%` : apkReady ? '100%' : '0%',
                height: '100%',
                background: apkReady ? '#10b981' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {/* Terminal Logs Output */}
          <div style={{ background: '#090d16', borderRadius: '14px', padding: '14px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', maxHeight: '240px', overflowY: 'auto', marginBottom: '18px' }}>
            {buildLogs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px', color: log.includes('[SUCCESS]') ? '#34d399' : log.includes('[OUTPUT]') ? '#facc15' : '#e2e8f0' }}>
                {log}
              </div>
            ))}
            {building && <div style={{ color: '#38bdf8' }}>Gradle worker is compiling this project…</div>}
            {buildError && <div style={{ marginTop: '10px', color: '#fca5a5' }}>{buildError}</div>}
            {artifactSha256 && <div style={{ marginTop: '10px', color: '#a7f3d0', wordBreak: 'break-all' }}>SHA-256: {artifactSha256}</div>}
          </div>

          {/* Download APK Action Buttons */}
          {apkReady && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <button
                type="button"
                onClick={downloadApkBinary}
                style={{
                  padding: '14px 20px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📥 Download Native Android APK (.apk)
              </button>

              <button
                type="button"
                onClick={downloadBuildManifest}
                style={{
                  padding: '14px 20px',
                  borderRadius: '16px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  border: '1.5px solid rgba(2, 132, 199, 0.3)',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📄 Download Build Manifest (.json)
              </button>
            </div>
          )}

          <div style={{ marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: 800 }}>Build history</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>Recent results are stored locally for this project; APK bytes are not stored in browser storage.</p>
              </div>
              {buildHistory.length > 0 && <button type="button" onClick={() => { setBuildHistory([]); try { window.localStorage.removeItem(historyKey); } catch { /* optional local history */ } }} style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>Clear history</button>}
            </div>
            {buildHistory.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '12px' }}>No completed builds yet.</div> : (
              <div style={{ display: 'grid', gap: '7px' }}>
                {buildHistory.map((item) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '90px minmax(0, 1fr)', gap: '10px', alignItems: 'baseline', background: '#f8fafc', borderRadius: '10px', padding: '9px 10px', fontSize: '11px' }}>
                    <strong style={{ color: item.status === 'ready' ? '#059669' : '#dc2626' }}>{item.status === 'ready' ? 'READY' : 'FAILED'}</strong>
                    <div style={{ minWidth: 0 }}><div style={{ color: '#334155', fontWeight: 700 }}>{new Date(item.createdAt).toLocaleString()} {item.artifactName ? `· ${item.artifactName}` : ''}</div><div style={{ color: '#64748b', overflowWrap: 'anywhere' }}>{item.sha256 ? `SHA-256: ${item.sha256}` : item.error || item.id}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
