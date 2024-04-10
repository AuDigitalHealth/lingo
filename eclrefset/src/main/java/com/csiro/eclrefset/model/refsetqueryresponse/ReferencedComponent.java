package com.csiro.eclrefset.model.refsetqueryresponse;

public class ReferencedComponent {

    String conceptId;
    boolean active;
    String definitionStatus;
    String moduleId;
    Fsn fsn;
    Pt pt;
    String id;

    public String getConceptId() {
        return conceptId;
    }
    public boolean isActive() {
        return active;
    }
    public String getDefinitionStatus() {
        return definitionStatus;
    }
    public String getModuleId() {
        return moduleId;
    }
    public Fsn getFsn() {
        return fsn;
    }
    public Pt getPt() {
        return pt;
    }
    public String getId() {
        return id;
    }
    public void setConceptId(String conceptId) {
        this.conceptId = conceptId;
    }
    public void setActive(boolean active) {
        this.active = active;
    }
    public void setDefinitionStatus(String definitionStatus) {
        this.definitionStatus = definitionStatus;
    }
    public void setModuleId(String moduleId) {
        this.moduleId = moduleId;
    }
    public void setFsn(Fsn fsn) {
        this.fsn = fsn;
    }
    public void setPt(Pt pt) {
        this.pt = pt;
    }
    public void setId(String id) {
        this.id = id;
    }
    
}
