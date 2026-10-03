"""
NETRA Security Graph Engine
Uses NetworkX to build and analyze network security topology
"""
import networkx as nx
from typing import Dict, List, Any, Optional
from loguru import logger

from app.models.models import SecurityGraph, GraphNode, GraphEdge


def build_security_graph(devices_data: List[Dict]) -> SecurityGraph:
    """
    Build a security graph from device data
    Represents devices, networks, and their relationships
    """
    G = nx.DiGraph()
    nodes = []
    edges = []
    
    # Add Internet node
    internet_node = GraphNode(
        id="internet",
        label="Internet",
        node_type="internet",
        risk_score=10.0,
        criticality="critical",
        properties={"description": "External threat surface"}
    )
    nodes.append(internet_node)
    G.add_node("internet", **internet_node.model_dump())
    
    # Process devices
    for device in devices_data:
        device_id = device.get("device_id", "")
        hostname = device.get("hostname", "unknown")
        vendor = device.get("vendor", "generic")
        device_type = device.get("device_type", "router")
        risk_score = device.get("risk_score", 5.0)
        criticality = device.get("criticality", "medium")
        
        # Add device node
        device_node = GraphNode(
            id=device_id,
            label=hostname,
            node_type=device_type,
            vendor=vendor,
            risk_score=risk_score,
            criticality=criticality,
            properties={
                "management_ip": device.get("management_ip", ""),
                "os_version": device.get("os_version", ""),
                "total_findings": device.get("total_findings", 0),
                "compliance_score": device.get("compliance_score", 0),
            }
        )
        nodes.append(device_node)
        G.add_node(device_id, **device_node.model_dump())
        
        # Add network nodes from interfaces
        nsir = device.get("nsir", {})
        if nsir:
            for intf in nsir.get("interfaces", []):
                if intf.get("ip_address") and not intf.get("shutdown"):
                    net_id = f"net_{device_id}_{intf['name']}"
                    net_node = GraphNode(
                        id=net_id,
                        label=f"{intf['ip_address']}/{intf.get('subnet_mask', '24')}",
                        node_type="network",
                        risk_score=risk_score * 0.7,
                        properties={
                            "interface": intf["name"],
                            "description": intf.get("description", "")
                        }
                    )
                    nodes.append(net_node)
                    G.add_node(net_id, **net_node.model_dump())
                    
                    # Edge: device -> network
                    edge = GraphEdge(
                        source=device_id,
                        target=net_id,
                        edge_type="routes_to",
                        properties={"interface": intf["name"]}
                    )
                    edges.append(edge)
                    G.add_edge(device_id, net_id, edge_type="routes_to")
    
    # Add connectivity edges between devices
    device_list = [d for d in devices_data]
    for i, dev_a in enumerate(device_list):
        for j, dev_b in enumerate(device_list):
            if i != j:
                # Create realistic connectivity based on device types
                type_a = dev_a.get("device_type", "router")
                type_b = dev_b.get("device_type", "router")
                
                # Firewall connects to routers
                if type_a == "firewall" and type_b == "router":
                    edge = GraphEdge(
                        source=dev_a["device_id"],
                        target=dev_b["device_id"],
                        edge_type="filters",
                        protocol="multi",
                        bidirectional=True,
                        properties={"description": "Firewall filters traffic to router"}
                    )
                    edges.append(edge)
                    G.add_edge(dev_a["device_id"], dev_b["device_id"], edge_type="filters")
                
                # Routers connect to each other
                elif type_a == "router" and type_b == "switch" and i < j:
                    edge = GraphEdge(
                        source=dev_a["device_id"],
                        target=dev_b["device_id"],
                        edge_type="connected",
                        protocol="ethernet",
                        bidirectional=True,
                    )
                    edges.append(edge)
                    G.add_edge(dev_a["device_id"], dev_b["device_id"], edge_type="connected")
    
    # Connect internet to high-risk devices (firewalls/routers)
    for device in devices_data:
        if device.get("device_type") in ["firewall", "router"]:
            edge = GraphEdge(
                source="internet",
                target=device["device_id"],
                edge_type="exposes",
                protocol="multi",
                properties={"description": "Internet-facing device"}
            )
            edges.append(edge)
            G.add_edge("internet", device["device_id"], edge_type="exposes")
    
    # Calculate attack paths
    attack_paths = _calculate_attack_paths(G, devices_data)
    
    # Risk summary
    risk_summary = _calculate_risk_summary(devices_data, G)
    
    return SecurityGraph(
        nodes=nodes,
        edges=edges,
        attack_paths=attack_paths,
        risk_summary=risk_summary
    )


def _calculate_attack_paths(G: nx.DiGraph, devices_data: List[Dict]) -> List[List[str]]:
    """Calculate potential attack paths from internet to critical assets"""
    attack_paths = []
    
    if "internet" not in G.nodes:
        return attack_paths
    
    # Find critical devices
    critical_devices = [
        d["device_id"] for d in devices_data 
        if d.get("criticality") in ["critical", "high"]
    ]
    
    for target in critical_devices[:3]:  # Limit to top 3 for performance
        try:
            if nx.has_path(G, "internet", target):
                paths = list(nx.all_simple_paths(G, "internet", target, cutoff=4))
                for path in paths[:2]:  # Max 2 paths per target
                    attack_paths.append(path)
        except Exception:
            pass
    
    return attack_paths


def _calculate_risk_summary(devices_data: List[Dict], G: nx.DiGraph) -> Dict[str, Any]:
    """Calculate risk summary metrics"""
    total_risk = sum(d.get("risk_score", 0) for d in devices_data)
    avg_risk = total_risk / len(devices_data) if devices_data else 0
    
    high_risk_devices = [
        d["hostname"] for d in devices_data 
        if d.get("risk_score", 0) >= 7.0
    ]
    
    internet_facing = [
        d["hostname"] for d in devices_data 
        if d.get("device_type") in ["firewall", "router"]
    ]
    
    return {
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "average_risk_score": round(avg_risk, 2),
        "high_risk_devices": high_risk_devices,
        "internet_facing_devices": internet_facing,
        "attack_surface_score": len(internet_facing) * 2.5,
        "network_complexity": G.number_of_edges() / max(G.number_of_nodes(), 1),
    }


def build_demo_graph() -> SecurityGraph:
    """Build a demo security graph with realistic topology"""
    nodes = [
        GraphNode(id="internet", label="Internet", node_type="internet", risk_score=10.0, criticality="critical"),
        GraphNode(id="fw-01", label="FortiGate-1000D", node_type="firewall", vendor="fortinet_fortios", risk_score=7.8, criticality="critical", properties={"ip": "203.0.113.1", "findings": 3}),
        GraphNode(id="router-01", label="Core-RTR-01", node_type="router", vendor="cisco_ios", risk_score=8.5, criticality="critical", properties={"ip": "10.0.0.1", "findings": 7}),
        GraphNode(id="router-02", label="Edge-RTR-02", node_type="router", vendor="cisco_ios_xe", risk_score=7.2, criticality="high", properties={"ip": "10.0.1.1", "findings": 5}),
        GraphNode(id="sw-01", label="Core-SW-01", node_type="switch", vendor="arista_eos", risk_score=5.5, criticality="medium", properties={"ip": "10.0.2.1", "findings": 2}),
        GraphNode(id="pa-01", label="PA-5220", node_type="firewall", vendor="palo_alto", risk_score=6.0, criticality="high", properties={"ip": "10.0.3.1", "findings": 2}),
        GraphNode(id="jnpr-01", label="MX480-Border", node_type="router", vendor="juniper_junos", risk_score=6.8, criticality="high", properties={"ip": "10.0.4.1", "findings": 2}),
        GraphNode(id="sonic-01", label="SONiC-Spine-01", node_type="switch", vendor="sonic", risk_score=4.5, criticality="medium", properties={"ip": "10.0.5.1", "findings": 1}),
        GraphNode(id="net-dmz", label="DMZ 10.10.0.0/24", node_type="network", risk_score=8.0, criticality="high"),
        GraphNode(id="net-internal", label="Internal 10.0.0.0/16", node_type="network", risk_score=6.0, criticality="high"),
        GraphNode(id="net-mgmt", label="MGMT 192.168.1.0/24", node_type="network", risk_score=9.0, criticality="critical"),
        GraphNode(id="srv-db", label="Database Server", node_type="service", risk_score=9.5, criticality="critical", properties={"port": 5432, "protocol": "PostgreSQL"}),
        GraphNode(id="srv-web", label="Web Server", node_type="service", risk_score=7.0, criticality="high", properties={"port": 443, "protocol": "HTTPS"}),
    ]
    
    edges = [
        GraphEdge(source="internet", target="fw-01", edge_type="exposes", protocol="multi", properties={"description": "Internet-facing"}),
        GraphEdge(source="internet", target="jnpr-01", edge_type="exposes", protocol="BGP", properties={"description": "BGP peering"}),
        GraphEdge(source="fw-01", target="router-01", edge_type="filters", protocol="multi", bidirectional=True),
        GraphEdge(source="fw-01", target="net-dmz", edge_type="routes_to", properties={"zone": "DMZ"}),
        GraphEdge(source="router-01", target="router-02", edge_type="connected", protocol="OSPF", bidirectional=True),
        GraphEdge(source="router-01", target="net-internal", edge_type="routes_to"),
        GraphEdge(source="router-02", target="sw-01", edge_type="connected", protocol="ethernet", bidirectional=True),
        GraphEdge(source="sw-01", target="sonic-01", edge_type="connected", protocol="ethernet", bidirectional=True),
        GraphEdge(source="pa-01", target="net-internal", edge_type="filters", protocol="multi", bidirectional=True),
        GraphEdge(source="jnpr-01", target="router-01", edge_type="connected", protocol="MPLS", bidirectional=True),
        GraphEdge(source="net-internal", target="srv-db", edge_type="exposes", port=5432, protocol="TCP"),
        GraphEdge(source="net-dmz", target="srv-web", edge_type="exposes", port=443, protocol="HTTPS"),
        GraphEdge(source="net-internal", target="net-mgmt", edge_type="routes_to"),
        GraphEdge(source="router-01", target="net-mgmt", edge_type="routes_to"),
    ]
    
    attack_paths = [
        ["internet", "fw-01", "router-01", "net-internal", "srv-db"],
        ["internet", "jnpr-01", "router-01", "net-internal", "srv-db"],
        ["internet", "fw-01", "net-dmz", "srv-web"],
        ["internet", "router-01", "net-mgmt"],  # Critical: direct mgmt access
    ]
    
    risk_summary = {
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "average_risk_score": 7.1,
        "high_risk_devices": ["Core-RTR-01", "FortiGate-1000D", "Edge-RTR-02"],
        "internet_facing_devices": ["FortiGate-1000D", "MX480-Border"],
        "attack_surface_score": 5.0,
        "network_complexity": 1.07,
        "critical_paths": 4,
        "exposed_services": ["Database Server", "Web Server"],
    }
    
    return SecurityGraph(
        nodes=nodes,
        edges=edges,
        attack_paths=attack_paths,
        risk_summary=risk_summary
    )
