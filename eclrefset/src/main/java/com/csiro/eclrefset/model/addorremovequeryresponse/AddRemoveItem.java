package com.csiro.eclrefset.model.addorremovequeryresponse;

public class AddRemoveItem {
	private String conceptId;
	private boolean active;
	private String definitionStatus;
	private String moduleId;
	private String effectiveTime;
	private Term fsn;
	private Term pt;
	private String id;
	private String idAndFsnTerm;

	public String getConceptId() {
		return conceptId;
	}

	public void setConceptId(String conceptId) {
		this.conceptId = conceptId;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
	}

	public String getDefinitionStatus() {
		return definitionStatus;
	}

	public void setDefinitionStatus(String definitionStatus) {
		this.definitionStatus = definitionStatus;
	}

	public String getModuleId() {
		return moduleId;
	}

	public void setModuleId(String moduleId) {
		this.moduleId = moduleId;
	}

	public String getEffectiveTime() {
		return effectiveTime;
	}

	public void setEffectiveTime(String effectiveTime) {
		this.effectiveTime = effectiveTime;
	}

	public Term getFsn() {
		return fsn;
	}

	public void setFsn(Term fsn) {
		this.fsn = fsn;
	}

	public Term getPt() {
		return pt;
	}

	public void setPt(Term pt) {
		this.pt = pt;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getIdAndFsnTerm() {
		return idAndFsnTerm;
	}

	public void setIdAndFsnTerm(String idAndFsnTerm) {
		this.idAndFsnTerm = idAndFsnTerm;
	}
}