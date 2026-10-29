#!/usr/bin/env python3
"""
Taiga Synchronization Tool for SIGPS - Portal Estudiantil
Conecta a Taiga (https://taiga.mixgyt.com) para listar y marcar tareas como listas/cerradas.
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.error

DEFAULT_TAIGA_URL = "https://taiga.mixgyt.com"

def load_env_file():
    """Carga variables desde ~/.env si existe."""
    env_path = os.path.expanduser("~/.env")
    if os.path.isfile(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("\"'")
                    if k not in os.environ:
                        os.environ[k] = v

def api_request(url, method="GET", data=None, token=None):
    """Realiza una petición HTTP a la API de Taiga."""
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "SIGPS-Taiga-Sync/1.0"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            if res_body:
                return json.loads(res_body)
            return None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_msg)
            raise RuntimeError(f"HTTP {e.code}: {err_json.get('_error_message', err_msg)}")
        except Exception:
            raise RuntimeError(f"HTTP {e.code}: {err_msg}")
    except Exception as e:
        raise RuntimeError(f"Error de conexión con {url}: {e}")

def authenticate(base_url, username, password):
    """Autentica con usuario y contraseña y retorna el auth_token."""
    auth_url = f"{base_url.rstrip('/')}/api/v1/auth"
    payload = {
        "type": "normal",
        "username": username,
        "password": password
    }
    res = api_request(auth_url, method="POST", data=payload)
    return res.get("auth_token"), res.get("id"), res.get("full_name") or res.get("username")

def get_current_user(base_url, token):
    """Obtiene datos del usuario autenticado."""
    url = f"{base_url.rstrip('/')}/api/v1/users/me"
    return api_request(url, token=token)

def get_user_projects(base_url, token, user_id):
    """Obtiene los proyectos del usuario."""
    url = f"{base_url.rstrip('/')}/api/v1/projects?member={user_id}"
    return api_request(url, token=token)

def get_project_tasks(base_url, token, project_id):
    """Obtiene las tareas de un proyecto."""
    url = f"{base_url.rstrip('/')}/api/v1/tasks?project={project_id}"
    return api_request(url, token=token)

def get_project_user_stories(base_url, token, project_id):
    """Obtiene las historias de usuario de un proyecto."""
    url = f"{base_url.rstrip('/')}/api/v1/userstories?project={project_id}"
    return api_request(url, token=token)

def update_task_status(base_url, token, task_id, status_id, version):
    """Actualiza el estado de una tarea."""
    url = f"{base_url.rstrip('/')}/api/v1/tasks/{task_id}"
    payload = {
        "status": status_id,
        "version": version
    }
    return api_request(url, method="PATCH", data=payload, token=token)

def update_user_story_status(base_url, token, us_id, status_id, version):
    """Actualiza el estado de una historia de usuario."""
    url = f"{base_url.rstrip('/')}/api/v1/userstories/{us_id}"
    payload = {
        "status": status_id,
        "version": version
    }
    return api_request(url, method="PATCH", data=payload, token=token)

def main():
    load_env_file()

    parser = argparse.ArgumentParser(description="Sincronizador de Taiga para SIGPS")
    parser.add_argument("--url", default=os.getenv("TAIGA_URL", DEFAULT_TAIGA_URL), help="URL de la instancia Taiga")
    parser.add_argument("--token", default=os.getenv("TAIGA_AUTH_TOKEN"), help="Token de autenticación")
    parser.add_argument("--username", default=os.getenv("TAIGA_USERNAME"), help="Usuario de Taiga")
    parser.add_argument("--password", default=os.getenv("TAIGA_PASSWORD"), help="Contraseña de Taiga")
    parser.add_argument("--project", default=os.getenv("TAIGA_PROJECT"), help="Nombre o slug del proyecto")
    parser.add_argument("--apply", action="store_true", help="Aplica los cambios en Taiga (sin esto es solo simulación)")
    parser.add_argument("--list-only", action="store_true", help="Solo lista proyectos y tareas sin modificar")

    args = parser.parse_args()

    token = args.token
    user_id = None
    user_name = None

    if not token:
        if args.username and args.password:
            print(f"[*] Autenticando en {args.url} con usuario '{args.username}'...")
            try:
                token, user_id, user_name = authenticate(args.url, args.username, args.password)
                print(f"[✓] Autenticado como: {user_name} (ID: {user_id})")
            except Exception as e:
                print(f"[!] Error de autenticación: {e}", file=sys.stderr)
                sys.exit(1)
        else:
            print("[!] No se proporcionaron credenciales para Taiga.", file=sys.stderr)
            print("    Configura TAIGA_AUTH_TOKEN o TAIGA_USERNAME y TAIGA_PASSWORD en ~/.env", file=sys.stderr)
            print("    o pásalas como argumentos: --username y --password", file=sys.stderr)
            sys.exit(2)
    else:
        try:
            me = get_current_user(args.url, token)
            user_id = me["id"]
            user_name = me.get("full_name") or me.get("username")
            print(f"[✓] Sesión activa con token: {user_name} (ID: {user_id})")
        except Exception as e:
            print(f"[!] Token inválido o expirado: {e}", file=sys.stderr)
            sys.exit(1)

    # Listar proyectos
    projects = get_user_projects(args.url, token, user_id)
    if not projects:
        print("[!] No se encontraron proyectos asociados a este usuario.")
        sys.exit(0)

    print(f"\n[+] Proyectos disponibles ({len(projects)}):")
    target_project = None
    for p in projects:
        is_target = False
        p_name = p.get("name", "")
        p_slug = p.get("slug", "")
        if args.project:
            if args.project.lower() in p_name.lower() or args.project.lower() in p_slug.lower():
                is_target = True
        elif "sigps" in p_name.lower() or "sigps" in p_slug.lower() or "sistema" in p_name.lower():
            is_target = True

        marker = "-> [SELECCIONADO]" if is_target else "  "
        print(f" {marker} ID: {p['id']} | {p_name} (slug: {p_slug})")
        if is_target and not target_project:
            target_project = p

    if not target_project and len(projects) == 1:
        target_project = projects[0]
        print(f"[*] Seleccionando único proyecto disponible: {target_project['name']}")

    if not target_project:
        print("\n[!] Especifica el proyecto con --project <slug_o_nombre>")
        sys.exit(1)

    print(f"\n[*] Analizando proyecto: {target_project['name']} (ID: {target_project['id']})")

    # Estados de tareas
    task_statuses = target_project.get("task_statuses", [])
    print("\n[+] Estados de tareas configurados:")
    ready_task_status = None
    for ts in task_statuses:
        name = ts["name"]
        is_closed = ts.get("is_closed", False)
        print(f"    - ID: {ts['id']} | {name} {'(CERRADO)' if is_closed else ''}")
        name_lower = name.lower()
        if is_closed or "listo" in name_lower or "cerrad" in name_lower or "done" in name_lower:
            if not ready_task_status or is_closed:
                ready_task_status = ts

    # Estados de historias
    us_statuses = target_project.get("us_statuses", [])
    ready_us_status = None
    for us_st in us_statuses:
        name = us_st["name"]
        is_closed = us_st.get("is_closed", False)
        name_lower = name.lower()
        if is_closed or "listo" in name_lower or "cerrad" in name_lower or "done" in name_lower:
            if not ready_us_status or is_closed:
                ready_us_status = us_st

    # Obtener tareas del proyecto
    tasks = get_project_tasks(args.url, token, target_project["id"])
    print(f"\n[*] Total de tareas en el proyecto: {len(tasks)}")

    # Filtrar tareas del usuario o relacionadas al portal estudiantil
    student_portal_keywords = [
        "portal", "estudiantil", "alumno", "estudiante", "guía", "guia", 
        "checklist", "f1", "f8", "formato", "carta", "solicitud", "horas",
        "inscripci", "proyecto", "memoria"
    ]

    juan_tasks = []
    for t in tasks:
        subj = t.get("subject", "").lower()
        assigned = t.get("assigned_to")
        # Es del usuario o coincide con el trabajo del portal estudiantil
        if assigned == user_id or any(kw in subj for kw in student_portal_keywords):
            juan_tasks.append(t)

    print(f"[*] Tareas identificadas en el alcance de Juan / Portal Estudiantil: {len(juan_tasks)}")

    already_done = []
    to_update = []

    for t in juan_tasks:
        st_id = t.get("status")
        is_closed = t.get("is_closed", False)
        # Buscar el nombre del estado
        st_name = next((s["name"] for s in task_statuses if s["id"] == st_id), "Desconocido")
        ref = t.get("ref")
        subj = t.get("subject")

        if is_closed or "listo" in st_name.lower() or "cerrad" in st_name.lower():
            already_done.append((ref, subj, st_name))
        else:
            to_update.append(t)

    print(f"\n[✓] Tareas que ya estaban listas/cerradas ({len(already_done)}) - NO SE MODIFICARÁN:")
    for ref, subj, st_name in already_done:
        print(f"    - #{ref}: {subj} [Estado actual: {st_name}]")

    print(f"\n[!] Tareas pendientes realizadas en este incremento para marcar como LISTO ({len(to_update)}):")
    for t in to_update:
        ref = t.get("ref")
        subj = t.get("subject")
        st_id = t.get("status")
        st_name = next((s["name"] for s in task_statuses if s["id"] == st_id), "Desconocido")
        print(f"    - #{ref}: {subj} [Estado actual: {st_name}] -> Cambiar a: [{ready_task_status['name']}]")

    if args.list_only or not args.apply:
        print("\n" + "="*60)
        print("MODO REVISIÓN (Simulación - Dry Run)")
        print("Para aplicar los cambios reales en Taiga, ejecuta con: --apply")
        print("="*60)
        return

    # Si se pasó --apply, actualizar tareas
    if not ready_task_status:
        print("[!] No se encontró un estado de cierre/listo adecuado para tareas.")
        sys.exit(1)

    print(f"\n[*] Actualizando {len(to_update)} tareas a estado '{ready_task_status['name']}'...")
    updated_count = 0
    for t in to_update:
        ref = t.get("ref")
        subj = t.get("subject")
        t_id = t.get("id")
        ver = t.get("version", 1)
        try:
            update_task_status(args.url, token, t_id, ready_task_status["id"], ver)
            print(f"  [✓] Tarea #{ref} actualizada: {subj}")
            updated_count += 1
        except Exception as e:
            print(f"  [X] Error al actualizar #{ref}: {e}")

    print(f"\n[✓] Finalizado: {updated_count} tareas marcadas como listas en Taiga.")

if __name__ == "__main__":
    main()
