/**
 * KingdomForge Unity C# Bridge & PC Installer Scripts
 * Production-ready Zero-Touch Unity Automation & Headless CLI Builder.
 */

export const BUILDER_CS_CONTENT = `using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.Build.Reporting;
using UnityEngine.EventSystems;

namespace AgentBridge
{
    /// <summary>
    /// Headless CI/CLI Automation Builder for KingdomForge
    /// Generates Zero-Touch Playable Scenes, HUD Canvas, and compiles StandaloneWindows64
    /// </summary>
    public static class Builder
    {
        private const string ScenePath = "Assets/Scenes/MainKingdomScene.unity";
        private const string ManifestRelativePath = "Assets/Resources/Generated/KingdomManifest.json";
        private const string SpritesFolderPath = "Assets/Resources/Generated/Sprites";
        private const string BuildOutputDirectory = "Builds";
        private const string ExeOutputName = "KingdomBuilder.exe";

        [MenuItem("KingdomForge/1. Bootstrap Complete Playable Scene")]
        public static void BootstrapPlayableScene()
        {
            Debug.Log("[AgentBridge] ==================================================");
            Debug.Log("[AgentBridge] Bootstrapping Zero-Touch Playable Kingdom Scene...");

            Directory.CreateDirectory("Assets/Scenes");

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // 1. Setup Camera (Isometric Orthographic with WASD Pan & Zoom)
            GameObject camObj = new GameObject("Main Camera");
            Camera cam = camObj.AddComponent<Camera>();
            camObj.tag = "MainCamera";
            cam.orthographic = true;
            cam.orthographicSize = 6.5f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.02f, 0.04f, 0.08f);
            camObj.transform.position = new Vector3(0, 0, -10f);
            camObj.AddComponent<AudioListener>();

            // 2. Setup Directional Light (Isometric angle)
            GameObject lightObj = new GameObject("Directional Light");
            Light light = lightObj.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.15f;
            light.color = new Color(1f, 0.95f, 0.85f);
            lightObj.transform.rotation = Quaternion.Euler(50, -30, 0);

            // 3. EventSystem for UI
            GameObject eventSystem = new GameObject("EventSystem");
            eventSystem.AddComponent<EventSystem>();
            eventSystem.AddComponent<StandaloneInputModule>();

            // 4. KingdomRuntimeLoader Host Object
            GameObject runtimeHost = new GameObject("KingdomRuntimeLoader");
            var loader = runtimeHost.AddComponent<KingdomForge.Runtime.KingdomRuntimeLoader>();

            // 5. In-Game HUD Canvas
            GameObject canvasObj = new GameObject("Kingdom_HUD_Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObj.AddComponent<CanvasScaler>();
            canvasObj.AddComponent<GraphicRaycaster>();

            // Resource Top-Bar
            GameObject topBar = new GameObject("ResourceTopBar");
            topBar.transform.SetParent(canvasObj.transform, false);
            RectTransform topBarRect = topBar.AddComponent<RectTransform>();
            topBarRect.anchorMin = new Vector2(0, 1);
            topBarRect.anchorMax = new Vector2(1, 1);
            topBarRect.pivot = new Vector2(0.5f, 1);
            topBarRect.sizeDelta = new Vector2(0, 48);
            Image topBarBg = topBar.AddComponent<Image>();
            topBarBg.color = new Color(0.05f, 0.08f, 0.14f, 0.92f);

            GameObject resTextObj = new GameObject("ResourceText");
            resTextObj.transform.SetParent(topBar.transform, false);
            RectTransform resTextRect = resTextObj.AddComponent<RectTransform>();
            resTextRect.anchorMin = Vector2.zero;
            resTextRect.anchorMax = Vector2.one;
            resTextRect.offsetMin = new Vector2(16, 0);
            resTextRect.offsetMax = new Vector2(-16, 0);
            Text resText = resTextObj.AddComponent<Text>();
            resText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            resText.fontSize = 15;
            resText.color = Color.white;
            resText.alignment = TextAnchor.MiddleLeft;
            resText.text = "Wood: 120  |  Stone: 60  |  Food: 85  |  Gold: 150  |  Morale: 92%  |  Pop: 3/10";

            // Save Scene
            EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log($"[AgentBridge] Zero-Touch Scene successfully saved to {ScenePath}");

            // Ensure Scene is in EditorBuildSettings
            EditorBuildSettingsScene[] buildScenes = new EditorBuildSettingsScene[]
            {
                new EditorBuildSettingsScene(ScenePath, true)
            };
            EditorBuildSettings.scenes = buildScenes;
        }

        [MenuItem("KingdomForge/Build Windows64 Standalone")]
        public static void BuildFromManifest()
        {
            Debug.Log("[AgentBridge] ==================================================");
            Debug.Log("[AgentBridge] Starting Headless KingdomForge Build Pipeline");
            Debug.Log($"[AgentBridge] System Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");

            // Auto-bootstrap scene if missing
            if (!File.Exists(ScenePath))
            {
                BootstrapPlayableScene();
            }

            // Phase 1: Validate Manifest
            string fullManifestPath = Path.Combine(Application.dataPath, "Resources/Generated/KingdomManifest.json");
            if (!File.Exists(fullManifestPath))
            {
                Debug.LogError($"[AgentBridge:Error] Manifest missing at: {fullManifestPath}");
                EditorApplication.Exit(1);
                return;
            }

            Debug.Log("[AgentBridge] Phase 1/4: Manifest JSON verified successfully.");

            // Phase 2: Sprite Database Calibration & Automatic Slicing
            try
            {
                ConfigureGeneratedSprites();
                Debug.Log("[AgentBridge] Phase 2/4: Sprite assets imported and sliced at 64 PPU with (0.5, 0.0) pivot.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AgentBridge:Error] Sprite configuration failed: {ex.Message}\\n{ex.StackTrace}");
                EditorApplication.Exit(2);
                return;
            }

            // Phase 3: Refresh and Save Assets
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            Debug.Log("[AgentBridge] Phase 3/4: AssetDatabase synchronized.");

            // Phase 4: Standalone Player Compilation
            string outputExePath = Path.Combine(BuildOutputDirectory, ExeOutputName);
            Directory.CreateDirectory(BuildOutputDirectory);

            string[] scenes = new string[] { ScenePath };

            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = outputExePath,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };

            Debug.Log($"[AgentBridge] Phase 4/4: Compiling Windows64 Standalone to {outputExePath}...");
            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            BuildSummary summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"[AgentBridge:Success] Build completed! Total size: {summary.totalSize / 1024 / 1024} MB, Duration: {summary.totalTime.TotalSeconds:F1}s");
                EditorApplication.Exit(0);
            }
            else
            {
                Debug.LogError($"[AgentBridge:Error] Build failed with result: {summary.result}. Total Errors: {summary.totalErrors}");
                EditorApplication.Exit(3);
            }
        }

        [MenuItem("KingdomForge/Configure Sprites from Manifest")]
        public static void ConfigureGeneratedSprites()
        {
            string[] textureGuids = AssetDatabase.FindAssets("t:Texture2D", new[] { SpritesFolderPath });
            Debug.Log($"[AgentBridge] Found {textureGuids.Length} sprite textures in {SpritesFolderPath}");

            foreach (string guid in textureGuids)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(guid);
                TextureImporter importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;
                if (importer == null) continue;

                importer.textureType = TextureImporterType.Sprite;
                importer.filterMode = FilterMode.Point;
                importer.spritePixelsPerUnit = 64;
                importer.textureCompression = TextureImporterCompression.Uncompressed;
                importer.mipmapEnabled = false;

                TextureImporterSettings settings = new TextureImporterSettings();
                importer.ReadTextureSettings(settings);
                settings.spriteAlignment = (int)SpriteAlignment.Custom;
                settings.spritePivot = new Vector2(0.5f, 0.0f);
                importer.SetTextureSettings(settings);

                if (assetPath.Contains("res_") || assetPath.Contains("character") || assetPath.Contains("sheet"))
                {
                    importer.spriteImportMode = SpriteImportMode.Multiple;
                    importer.spritesheet = GenerateSpriteSheetMetadata(assetPath, 64, 64);
                }
                else
                {
                    importer.spriteImportMode = SpriteImportMode.Single;
                }

                EditorUtility.SetDirty(importer);
                importer.SaveAndReimport();
                Debug.Log($"[AgentBridge] Configured and sliced sprite: {assetPath}");
            }
        }

        private static SpriteMetaData[] GenerateSpriteSheetMetadata(string assetPath, int cellWidth, int cellHeight)
        {
            Texture2D tex = AssetDatabase.LoadAssetAtPath<Texture2D>(assetPath);
            if (tex == null) return new SpriteMetaData[0];

            int cols = Mathf.Max(1, tex.width / cellWidth);
            int rows = Mathf.Max(1, tex.height / cellHeight);
            List<SpriteMetaData> metas = new List<SpriteMetaData>();

            int frameIndex = 0;
            for (int r = rows - 1; r >= 0; r--)
            {
                for (int c = 0; c < cols; c++)
                {
                    SpriteMetaData meta = new SpriteMetaData
                    {
                        name = $"{Path.GetFileNameWithoutExtension(assetPath)}_{frameIndex++}",
                        rect = new Rect(c * cellWidth, r * cellHeight, cellWidth, cellHeight),
                        alignment = (int)SpriteAlignment.Custom,
                        pivot = new Vector2(0.5f, 0.0f)
                    };
                    metas.Add(meta);
                }
            }

            return metas.ToArray();
        }
    }
}
`;

export const KINGDOM_RUNTIME_LOADER_CS_CONTENT = `using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace KingdomForge.Runtime
{
    [Serializable]
    public class CostData
    {
        public int wood;
        public int stone;
        public int gold;
    }

    [Serializable]
    public class ProductionData
    {
        public string resource;
        public float ratePerMin;
    }

    [Serializable]
    public class ArcadeJuiceData
    {
        public float placementBounce;
        public float screenShakeIntensity;
        public string particleColor;
    }

    [Serializable]
    public class BuildingData
    {
        public string id;
        public string name;
        public string category;
        public string footprint;
        public CostData cost;
        public ProductionData production;
        public int jobsProvided;
        public ArcadeJuiceData arcadeJuice;
        public int gridX;
        public int gridY;
        public bool placed;
    }

    [Serializable]
    public class ResidentData
    {
        public string id;
        public string name;
        public string role;
        public string personalityTrait;
        public float baseWalkSpeed;
        public float workEfficiency;
        public string[] dialogueLines;
        public float x;
        public float y;
        public string state;
    }

    [Serializable]
    public class ArcadeSettingsData
    {
        public float placementBounce;
        public float screenShake;
        public float dayNightCycleSpeed;
        public float globalWalkSpeed;
    }

    [Serializable]
    public class KingdomManifestRoot
    {
        public string version;
        public string gameTitle;
        public ArcadeSettingsData arcadeSettings;
        public BuildingData[] buildings;
        public ResidentData[] residents;
    }

    /// <summary>
    /// Playable Runtime Game Loader, Player Camera Controller & Town Grid Engine
    /// Includes WASD/Mouse Pan, Scroll Zoom, Ghost Building Preview, and Resident Inspection.
    /// </summary>
    public class KingdomRuntimeLoader : MonoBehaviour
    {
        [Header("Manifest Configuration")]
        [SerializeField] private string manifestResourcePath = "Generated/KingdomManifest";
        [SerializeField] private float tileSize = 1.0f;
        [SerializeField] private int gridDimension = 12;

        [Header("Player Economy")]
        public int wood = 150;
        public int stone = 80;
        public int food = 100;
        public int gold = 200;
        public float townMorale = 90f;

        [Header("Camera & Controls")]
        [SerializeField] private float panSpeed = 8f;
        [SerializeField] private float zoomSpeed = 2f;
        [SerializeField] private float minZoom = 3f;
        [SerializeField] private float maxZoom = 12f;

        private Camera mainCamera;
        private KingdomManifestRoot manifest;
        private readonly Dictionary<string, GameObject> spawnedBuildings = new Dictionary<string, GameObject>();
        private readonly List<ResidentController> activeResidents = new List<ResidentController>();
        private readonly bool[,] gridOccupied = new bool[12, 12];

        // Ghost building preview
        private GameObject ghostPreviewObj;
        private SpriteRenderer ghostRenderer;
        private BuildingData activeBuildPlacement = null;

        private void Awake()
        {
            mainCamera = Camera.main;
            if (mainCamera == null)
            {
                mainCamera = FindFirstObjectByType<Camera>();
            }
        }

        private void Start()
        {
            LoadManifestAndBootstrap();
            SetupGhostPreview();
        }

        private void Update()
        {
            HandleCameraControls();
            HandleBuildingPlacementPreview();
            HandleResidentSelection();
        }

        public void LoadManifestAndBootstrap()
        {
            TextAsset jsonAsset = Resources.Load<TextAsset>(manifestResourcePath);
            if (jsonAsset == null)
            {
                Debug.LogError($"[KingdomForge:Runtime] Missing manifest at Resources/{manifestResourcePath}.json");
                return;
            }

            manifest = JsonUtility.FromJson<KingdomManifestRoot>(jsonAsset.text);
            Debug.Log($"[KingdomForge:Runtime] Bootstrapped '{manifest.gameTitle}' v{manifest.version}");

            BuildTownGrid();
            SpawnInitialBuildings();
            SpawnInitialResidents();
        }

        private void BuildTownGrid()
        {
            GameObject gridParent = new GameObject("Town_Grid_12x12");
            gridParent.transform.SetParent(transform);

            for (int x = 0; x < gridDimension; x++)
            {
                for (int y = 0; y < gridDimension; y++)
                {
                    Vector3 worldPos = GridToWorld(x, y);
                    GameObject tile = GameObject.CreatePrimitive(PrimitiveType.Quad);
                    tile.name = $"Tile_{x}_{y}";
                    tile.transform.position = worldPos;
                    tile.transform.rotation = Quaternion.Euler(0, 0, 0);
                    tile.transform.localScale = new Vector3(tileSize * 0.96f, tileSize * 0.48f, 1f);
                    tile.transform.SetParent(gridParent.transform);

                    Renderer rend = tile.GetComponent<Renderer>();
                    rend.material.color = ((x + y) % 2 == 0) ? new Color(0.10f, 0.14f, 0.20f) : new Color(0.06f, 0.09f, 0.14f);
                }
            }
        }

        private void SpawnInitialBuildings()
        {
            if (manifest.buildings == null) return;
            foreach (var b in manifest.buildings)
            {
                if (b.placed)
                {
                    SpawnBuildingAt(b, b.gridX, b.gridY);
                }
            }
        }

        private void SpawnInitialResidents()
        {
            if (manifest.residents == null) return;
            foreach (var r in manifest.residents)
            {
                GameObject resObj = new GameObject($"Resident_{r.name}");
                resObj.transform.position = GridToWorld(Mathf.RoundToInt(r.x), Mathf.RoundToInt(r.y));
                resObj.transform.SetParent(transform);

                ResidentController controller = resObj.AddComponent<ResidentController>();
                controller.Initialize(r, manifest.arcadeSettings);
                activeResidents.Add(controller);
            }
        }

        public GameObject SpawnBuildingAt(BuildingData b, int gx, int gy)
        {
            Vector3 worldPos = GridToWorld(gx, gy);
            GameObject bObj = new GameObject($"Building_{b.name}_{gx}_{gy}");
            bObj.transform.position = worldPos;
            bObj.transform.SetParent(transform);

            SpriteRenderer sr = bObj.AddComponent<SpriteRenderer>();
            sr.sortingOrder = Mathf.RoundToInt(-worldPos.y * 100);

            Sprite loaded = Resources.Load<Sprite>($"Generated/Sprites/{b.id}");
            if (loaded != null) sr.sprite = loaded;

            gridOccupied[gx, gy] = true;
            StartCoroutine(AnimatePlacementBounce(bObj.transform, b.arcadeJuice.placementBounce));
            TriggerScreenShake(b.arcadeJuice.screenShakeIntensity);

            spawnedBuildings[b.id] = bObj;
            return bObj;
        }

        private void SetupGhostPreview()
        {
            ghostPreviewObj = new GameObject("GhostBuildingPreview");
            ghostPreviewObj.transform.SetParent(transform);
            ghostRenderer = ghostPreviewObj.AddComponent<SpriteRenderer>();
            ghostRenderer.sortingOrder = 999;
            ghostPreviewObj.SetActive(false);
        }

        private void HandleCameraControls()
        {
            if (mainCamera == null) return;

            // WASD Pan
            float h = Input.GetAxisRaw("Horizontal");
            float v = Input.GetAxisRaw("Vertical");

            // Mouse Right-Click Drag
            if (Input.GetMouseButton(1))
            {
                h -= Input.GetAxis("Mouse X") * 1.5f;
                v -= Input.GetAxis("Mouse Y") * 1.5f;
            }

            Vector3 move = new Vector3(h, v, 0) * (panSpeed * Time.deltaTime);
            mainCamera.transform.position += move;

            // Scroll Wheel Zoom
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.01f)
            {
                mainCamera.orthographicSize = Mathf.Clamp(
                    mainCamera.orthographicSize - scroll * zoomSpeed * 4f,
                    minZoom,
                    maxZoom
                );
            }
        }

        private void HandleBuildingPlacementPreview()
        {
            if (activeBuildPlacement == null)
            {
                if (ghostPreviewObj != null) ghostPreviewObj.SetActive(false);
                return;
            }

            ghostPreviewObj.SetActive(true);
            Vector3 mouseWorld = mainCamera.ScreenToWorldPoint(Input.mousePosition);
            Vector2Int gridPos = WorldToGrid(mouseWorld);

            bool inBounds = gridPos.x >= 0 && gridPos.x < gridDimension && gridPos.y >= 0 && gridPos.y < gridDimension;
            bool isFree = inBounds && !gridOccupied[gridPos.x, gridPos.y];
            bool canAfford = wood >= activeBuildPlacement.cost.wood && stone >= activeBuildPlacement.cost.stone && gold >= activeBuildPlacement.cost.gold;

            Vector3 targetSnap = GridToWorld(gridPos.x, gridPos.y);
            ghostPreviewObj.transform.position = targetSnap;

            // Green if buildable, Red if blocked
            if (isFree && canAfford)
            {
                ghostRenderer.color = new Color(0.2f, 1f, 0.4f, 0.65f);
                if (Input.GetMouseButtonDown(0))
                {
                    wood -= activeBuildPlacement.cost.wood;
                    stone -= activeBuildPlacement.cost.stone;
                    gold -= activeBuildPlacement.cost.gold;
                    SpawnBuildingAt(activeBuildPlacement, gridPos.x, gridPos.y);
                    activeBuildPlacement = null; // Reset tool
                }
            }
            else
            {
                ghostRenderer.color = new Color(1f, 0.2f, 0.2f, 0.65f);
            }
        }

        private void HandleResidentSelection()
        {
            if (Input.GetMouseButtonDown(0) && activeBuildPlacement == null)
            {
                Vector3 mouseWorld = mainCamera.ScreenToWorldPoint(Input.mousePosition);
                Collider2D hit = Physics2D.OverlapPoint(mouseWorld);
                if (hit != null)
                {
                    ResidentController res = hit.GetComponent<ResidentController>();
                    if (res != null)
                    {
                        Debug.Log($"[KingdomForge:Inspect] Selected Resident: {res.ResidentName} | Role: {res.Role} | Trait: {res.Trait}");
                    }
                }
            }
        }

        public Vector3 GridToWorld(int x, int y)
        {
            float isoX = (x - y) * (tileSize * 0.5f);
            float isoY = (x + y) * (tileSize * 0.25f);
            return new Vector3(isoX, isoY, 0);
        }

        public Vector2Int WorldToGrid(Vector3 worldPos)
        {
            float x = (worldPos.x / (tileSize * 0.5f) + worldPos.y / (tileSize * 0.25f)) * 0.5f;
            float y = (worldPos.y / (tileSize * 0.25f) - worldPos.x / (tileSize * 0.5f)) * 0.5f;
            return new Vector2Int(Mathf.RoundToInt(x), Mathf.RoundToInt(y));
        }

        public void SetActiveBuildPlacement(BuildingData b)
        {
            activeBuildPlacement = b;
            if (b != null)
            {
                Sprite sp = Resources.Load<Sprite>($"Generated/Sprites/{b.id}");
                if (sp != null) ghostRenderer.sprite = sp;
            }
        }

        public void TriggerScreenShake(float intensity)
        {
            if (mainCamera != null && intensity > 0.05f)
            {
                StartCoroutine(DoScreenShake(intensity * manifest.arcadeSettings.screenShake));
            }
        }

        private IEnumerator AnimatePlacementBounce(Transform target, float elasticity)
        {
            Vector3 originalScale = target.localScale;
            target.localScale = Vector3.zero;
            float duration = 0.45f;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                float scaleMultiplier = Mathf.Sin(t * Mathf.PI * (0.5f + 2f * elasticity)) * (1f - t) + t;
                target.localScale = originalScale * Mathf.Clamp(scaleMultiplier, 0f, 1.4f);
                yield return null;
            }
            target.localScale = originalScale;
        }

        private IEnumerator DoScreenShake(float intensity)
        {
            Vector3 originalPos = mainCamera.transform.position;
            float elapsed = 0f;
            float duration = 0.25f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                Vector3 offset = UnityEngine.Random.insideUnitSphere * (intensity * 0.4f);
                offset.z = 0;
                mainCamera.transform.position = originalPos + offset;
                yield return null;
            }
            mainCamera.transform.position = originalPos;
        }
    }

    public class ResidentController : MonoBehaviour
    {
        private ResidentData data;
        private ArcadeSettingsData arcadeSettings;
        private SpriteRenderer spriteRenderer;
        private Vector3 currentTarget;
        private float stateTimer = 0f;

        public string ResidentName => data != null ? data.name : "Villager";
        public string Role => data != null ? data.role : "Citizen";
        public string Trait => data != null ? data.personalityTrait : "Humble";

        public void Initialize(ResidentData residentData, ArcadeSettingsData settings)
        {
            data = residentData;
            arcadeSettings = settings;
            spriteRenderer = gameObject.AddComponent<SpriteRenderer>();

            CircleCollider2D col = gameObject.AddComponent<CircleCollider2D>();
            col.radius = 0.4f;

            Sprite[] sprites = Resources.LoadAll<Sprite>($"Generated/Sprites/{data.id}");
            if (sprites.Length > 0) spriteRenderer.sprite = sprites[0];

            PickNewStateAndTarget();
        }

        private void Update()
        {
            stateTimer -= Time.deltaTime;
            float speed = data.baseWalkSpeed * arcadeSettings.globalWalkSpeed;

            if (Vector3.Distance(transform.position, currentTarget) > 0.05f)
            {
                transform.position = Vector3.MoveTowards(transform.position, currentTarget, speed * Time.deltaTime);
                spriteRenderer.sortingOrder = Mathf.RoundToInt(-transform.position.y * 100) + 1;
            }
            else if (stateTimer <= 0f)
            {
                PickNewStateAndTarget();
            }
        }

        private void PickNewStateAndTarget()
        {
            stateTimer = UnityEngine.Random.Range(3f, 7f);
            currentTarget = transform.position + (Vector3)(UnityEngine.Random.insideUnitCircle * 2.5f);
        }
    }
}
`;

export const INSTALL_BAT_CONTENT = `@echo off
echo =================================================================
echo   KingdomForge // Unity AI Builder - Local Installation Hook
echo =================================================================
echo.

node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Node.js environment detected.
echo [2/3] Installing application dependencies...
call npm install

if not exist .env.local (
    echo [3/3] Creating .env.local configuration file...
    (
        echo # KingdomForge Local Daemon Config
        echo UNITY_PROJECT_PATH=C:/Users/%USERNAME%/Documents/UnityKingdomGame
        echo UNITY_EXE_PATH=C:/Program Files/Unity/Hub/Editor/2022.3.20f1/Editor/Unity.exe
        echo SPRITE_WEBHOOK_URL=http://localhost:8080/generate-sprite
        echo MEDIA_WEBHOOK_URL=http://localhost:8080/generate-media
    ) > .env.local
    echo [OK] .env.local created.
) else (
    echo [3/3] .env.local already exists.
)

echo.
echo =================================================================
echo   Installation Complete! Run 2-start-kingdom-forge.bat to launch.
echo =================================================================
pause
`;

export const START_BAT_CONTENT = `@echo off
echo =================================================================
echo   Starting KingdomForge: Unity AI Builder & Orchestrator
echo =================================================================
echo.

echo Launching local server on http://localhost:3000...
start http://localhost:3000
npm run dev
pause
`;

export const SETUP_AND_RUN_BAT_CONTENT = `@echo off
title KingdomForge: Unity AI Orchestrator
echo [KingdomForge] Checking dependencies and launching environment...
call npm install
start http://localhost:3000
npm run dev
`;
