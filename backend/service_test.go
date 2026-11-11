package main

import (
	"encoding/json"
	"testing"
)

func configJSON(t *testing.T, svc *ServiceContext) map[string]any {
	t.Helper()
	b, err := json.Marshal(svc.baseConfig("search.lib.virginia.edu"))
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatal(err)
	}
	return m
}

func TestConfigIncludesAlertsSrc(t *testing.T) {
	m := configJSON(t, &ServiceContext{AlertsURL: "https://alerts.test/"})
	alerts, ok := m["alerts"].(map[string]any)
	if !ok || alerts["src"] != "https://alerts.test/" {
		t.Fatalf("alerts = %#v", m["alerts"])
	}
	if _, has := m["firebase"]; has {
		t.Fatal("firebase must no longer be sent to the client")
	}
}

func TestConfigOmitsAlertsWhenUnset(t *testing.T) {
	m := configJSON(t, &ServiceContext{})
	if _, has := m["alerts"]; has {
		t.Fatalf("alerts should be omitted when -alertsurl is empty: %#v", m["alerts"])
	}
}

func TestBaseConfigKeepsKioskAndDevDetection(t *testing.T) {
	svc := &ServiceContext{}
	if c := svc.baseConfig("search-kiosk.lib.virginia.edu"); !c.KioskMode {
		t.Fatal("-kiosk host must enable kiosk mode")
	}
	if c := svc.baseConfig("search-dev.lib.virginia.edu"); !c.DevServer {
		t.Fatal("-dev host must flag a dev server")
	}
	if c := svc.baseConfig("search.lib.virginia.edu"); c.KioskMode || c.DevServer {
		t.Fatal("production host is neither kiosk nor dev")
	}
}
